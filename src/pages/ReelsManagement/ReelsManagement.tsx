"use client";

import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit2,
  FiFilm,
  FiImage,
  FiLink,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUpload,
  FiUsers,
  FiX,
} from "react-icons/fi";
import GlobalModal from "@/components/common/GlobalModal";
import reelsApi, { Reel } from "../../api/endpoints/reels";
import { productApi } from "../../api/endpoints/product";
import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

// =====================================================
// DEFAULT LOGO
// =====================================================

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

// =====================================================
// PERMISSIONS
// Include both "update" and "edit" naming used by different permission setups.
// =====================================================
const VIEW_PERMISSION_KEYS = ["reels.view", "reel.view", "Reels.view", "Reel.view"];
const CREATE_PERMISSION_KEYS = ["reels.create", "reel.create", "Reels.create", "Reel.create"];
const UPDATE_PERMISSION_KEYS = [
  "reels.update",
  "reel.update",
  "Reels.update",
  "Reel.update",
  "reels.edit",
  "reel.edit",
  "Reels.edit",
  "Reel.edit",
];
const DELETE_PERMISSION_KEYS = ["reels.delete", "reel.delete", "Reels.delete", "Reel.delete"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 110, damping: 16 },
  },
};

interface ReelProduct {
  id: number;
  name?: string | null;
  slug?: string | null;
  product_code?: string | null;
  product_link?: string | null;
}

interface ReelFormModalProps {
  open: boolean;
  loading: boolean;
  mode: "add" | "edit";
  reel: Reel | null;
  products: ReelProduct[];
  productsLoading: boolean;
  canSubmit: boolean;
  onClose: () => void;
  onSubmit: (payload: FormData) => void;
}

interface DeleteReelModalProps {
  open: boolean;
  loading: boolean;
  reel: Reel | null;
  onClose: () => void;
  onConfirm: () => void;
}

interface ReelCardProps {
  reel: Reel;
  serialNumber: number;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (reel: Reel) => void;
  onDelete: (reel: Reel) => void;
}

const getVideoUrl = (reel: Reel | null) =>
  reel?.video_full_path || reel?.video_full_url || reel?.video_url || reel?.video_path || "";

const getThumbnailUrl = (reel: Reel | null) => reel?.thumbnail_url || reel?.thumbnail || "";

const getReelProduct = (reel: Reel | null) => (reel?.product || null) as ReelProduct | null;

const getProductSlug = (reel: Reel | null) => getReelProduct(reel)?.slug || "";

const getProductLink = (reel: Reel | null) => {
  const product = getReelProduct(reel);
  if (!product) return "";
  return product.product_link || (product.slug ? `/products/${product.slug}` : "");
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const inputClass =
  "h-11 w-full rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10 disabled:cursor-not-allowed disabled:opacity-60";
const labelClass = "mb-1.5 block text-xs font-semibold text-[#6B7280]";


const ReelFormModal: React.FC<ReelFormModalProps> = ({
  open,
  loading,
  mode,
  reel,
  products,
  productsLoading,
  canSubmit,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [creatorHandle, setCreatorHandle] = useState("");
  const [followersCount, setFollowersCount] = useState("");
  const [productId, setProductId] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState("1");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const videoObjectUrlRef = useRef<string | null>(null);
  const thumbnailObjectUrlRef = useRef<string | null>(null);

  const cleanupPreviewUrls = () => {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }
    if (thumbnailObjectUrlRef.current) {
      URL.revokeObjectURL(thumbnailObjectUrlRef.current);
      thumbnailObjectUrlRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      cleanupPreviewUrls();
      return;
    }

    cleanupPreviewUrls();
    if (mode === "edit" && reel) {
      setTitle(reel.title || "");
      setCreatorHandle(reel.creator_handle || "");
      setFollowersCount(String(reel.followers_count ?? 0));
      setProductId(reel.product?.id ? String(reel.product.id) : "");
      setIsPublished(Boolean(reel.is_published));
      setSortOrder(String(reel.sort_order ?? 1));
      setVideoUrl(reel.video_url || "");
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoPreview(getVideoUrl(reel));
      setThumbnailPreview(getThumbnailUrl(reel));
    } else {
      setTitle("");
      setCreatorHandle("");
      setFollowersCount("");
      setProductId("");
      setIsPublished(true);
      setSortOrder("1");
      setVideoUrl("");
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoPreview("");
      setThumbnailPreview("");
    }

    if (videoInputRef.current) videoInputRef.current.value = "";
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    return () => cleanupPreviewUrls();
    // The modal needs to reset whenever it opens or the selected reel changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, reel]);

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!canSubmit) {
      toast.error("You do not have permission to update reels.");
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file.");
      event.target.value = "";
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video size should be less than 50MB.");
      event.target.value = "";
      return;
    }
    if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
    const url = URL.createObjectURL(file);
    videoObjectUrlRef.current = url;
    setVideoFile(file);
    setVideoPreview(url);
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!canSubmit) {
      toast.error("You do not have permission to update reels.");
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Thumbnail size should be less than 5MB.");
      event.target.value = "";
      return;
    }
    if (thumbnailObjectUrlRef.current) URL.revokeObjectURL(thumbnailObjectUrlRef.current);
    const url = URL.createObjectURL(file);
    thumbnailObjectUrlRef.current = url;
    setThumbnailFile(file);
    setThumbnailPreview(url);
  };

  const resetVideo = () => {
    if (!canSubmit) return;
    if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
    videoObjectUrlRef.current = null;
    setVideoFile(null);
    setVideoPreview(mode === "edit" && reel ? getVideoUrl(reel) : "");
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const resetThumbnail = () => {
    if (!canSubmit) return;
    if (thumbnailObjectUrlRef.current) URL.revokeObjectURL(thumbnailObjectUrlRef.current);
    thumbnailObjectUrlRef.current = null;
    setThumbnailFile(null);
    setThumbnailPreview(mode === "edit" && reel ? getThumbnailUrl(reel) : "");
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error(`You do not have permission to ${mode === "add" ? "create" : "update"} reels.`);
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedCreator = creatorHandle.trim();
    const trimmedFollowers = followersCount.trim();
    const followers = Number(trimmedFollowers);
    const parsedProductId = productId.trim() ? Number(productId) : null;
    const parsedSortOrder = sortOrder.trim() ? Number(sortOrder) : 1;

    if (!trimmedTitle) return void toast.error("Please enter reel title.");
    if (!trimmedCreator) return void toast.error("Please enter creator handle.");
    if (!trimmedFollowers) return void toast.error("Please enter followers count.");
    if (!Number.isFinite(followers) || followers < 0) {
      return void toast.error("Please enter valid followers count.");
    }
    if (productId.trim() && (!parsedProductId || parsedProductId <= 0)) {
      return void toast.error("Please select a valid product.");
    }
    if (!Number.isFinite(parsedSortOrder) || parsedSortOrder < 0) {
      return void toast.error("Please enter valid sort order.");
    }
    if (mode === "add" && !videoFile && !videoUrl.trim()) {
      return void toast.error("Please upload a video or enter video URL.");
    }
    if (mode === "add" && !thumbnailFile) {
      return void toast.error("Please upload thumbnail.");
    }

    const formData = new FormData();
    formData.append("title", trimmedTitle);
    formData.append("creator_handle", trimmedCreator);
    formData.append("followers_count", String(followers));
    if (parsedProductId !== null && !Number.isNaN(parsedProductId)) {
      formData.append("product_id", String(parsedProductId));
    }
    formData.append("is_published", isPublished ? "1" : "0");
    formData.append("sort_order", String(parsedSortOrder));
    if (videoFile instanceof File) formData.append("video", videoFile, videoFile.name);
    if (videoUrl.trim()) formData.append("video_url", videoUrl.trim());
    if (thumbnailFile instanceof File) {
      formData.append("thumbnail", thumbnailFile, thumbnailFile.name);
    }
    onSubmit(formData);
  };

  const handleClose = () => {
    if (loading) return;
    cleanupPreviewUrls();
    onClose();
  };

  if (!canSubmit) return null;

  return (
    <GlobalModal isOpen={open} onClose={handleClose} closeOnOverlayClick={!loading} title="">
      <div className="w-full max-w-[650px] overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#FACC15]" />
        <div className="flex items-start justify-between border-b border-[#DCE6F2] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FiFilm size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#111827]">
                {mode === "add" ? "Add Reel" : "Update Reel"}
              </h2>
              <p className="mt-0.5 text-xs text-[#6B7280]">
                {mode === "add" ? "Create a new social reel." : "Update reel content and details."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="max-h-[76vh] overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Reel Title <span className="ml-1 text-[#C23B32]">*</span></label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} placeholder="Enter your reel title" className={inputClass} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Creator Handle <span className="ml-1 text-[#C23B32]">*</span></label>
                <input value={creatorHandle} onChange={(e) => setCreatorHandle(e.target.value)} disabled={loading} placeholder="Enter creator name" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Followers Count</label>
                <div className="relative">
                  <FiUsers size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]" />
                  <input type="number" min="0" value={followersCount} onChange={(e) => setFollowersCount(e.target.value)} disabled={loading} placeholder="100" className={`${inputClass} pl-10`} />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Sort Order</label>
              <input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} disabled={loading} placeholder="1" className={inputClass} />
              <p className="mt-1 text-[10px] text-[#6B7280]">Controls the display order of the reel.</p>
            </div>

            <div>
              <label className={labelClass}>Product</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} disabled={loading || productsLoading} className={inputClass}>
                <option value="">{productsLoading ? "Loading products..." : "Select the product for your reel"}</option>
                {products.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.name || product.product_code || product.slug || `Product ${product.id}`}
                    {product.slug && product.name ? ` — ${product.slug}` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-[#6B7280]">Select a product to link with this reel.</p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-[#111827]">Publish Reel</p>
                <p className="mt-0.5 text-[10px] text-[#6B7280]">Published reels are visible on the website.</p>
              </div>
              <button type="button" disabled={loading} onClick={() => setIsPublished((value) => !value)} aria-label="Toggle published status" className={`relative h-6 w-11 rounded-full transition ${isPublished ? "bg-[#2D6FE8]" : "bg-[#DCE6F2]"}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${isPublished ? "left-6" : "left-1"}`} />
              </button>
            </div>

            <div>
              <label className={labelClass}>Video URL</label>
              <div className="relative">
                <FiLink size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]" />
                <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} disabled={loading} placeholder="https://www.youtube.com/shorts/..." className={`${inputClass} pl-10`} />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#6B7280]">Video File {mode === "add" && <span className="ml-1 text-[#C23B32]">*</span>}</label>
                <span className="text-[10px] text-[#6B7280]">Max 50MB</span>
              </div>
              <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoChange} disabled={loading} className="hidden" />
              {!videoPreview ? (
                <button type="button" onClick={() => videoInputRef.current?.click()} disabled={loading} className="flex w-full items-center justify-center gap-4 rounded-xl border border-dashed border-[#DCE6F2] bg-[#F4F8FD] px-5 py-7 transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]"><FiUpload size={19} /></div>
                  <div className="text-left"><p className="text-sm font-semibold text-[#111827]">Upload Reel Video</p><p className="mt-0.5 text-[10px] text-[#6B7280]">MP4, MOV, WEBM or other supported video</p></div>
                </button>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
                  <div className="flex gap-3">
                    <div className="h-[90px] w-[70px] shrink-0 overflow-hidden rounded-xl bg-black"><video src={videoPreview} className="h-full w-full object-cover" controls playsInline /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#111827]">{videoFile?.name || "Current reel video"}</p>
                      <p className="mt-1 text-[10px] text-[#6B7280]">{videoFile ? "New video selected" : "Current uploaded video"}</p>
                      <div className="mt-3 flex gap-3">
                        <button type="button" onClick={() => videoInputRef.current?.click()} disabled={loading} className="text-xs font-semibold text-[#2D6FE8] hover:underline">Change Video</button>
                        {videoFile && <button type="button" onClick={resetVideo} disabled={loading} className="text-xs font-semibold text-[#C23B32] hover:underline">Reset</button>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#6B7280]">Thumbnail {mode === "add" && <span className="ml-1 text-[#C23B32]">*</span>}</label>
                <span className="text-[10px] text-[#6B7280]">Max 5MB</span>
              </div>
              <input ref={thumbnailInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleThumbnailChange} disabled={loading} className="hidden" />
              {!thumbnailPreview ? (
                <button type="button" onClick={() => thumbnailInputRef.current?.click()} disabled={loading} className="flex w-full items-center justify-center gap-4 rounded-xl border border-dashed border-[#DCE6F2] bg-[#F4F8FD] px-5 py-7 transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]"><FiImage size={19} /></div>
                  <div className="text-left"><p className="text-sm font-semibold text-[#111827]">Upload Thumbnail</p><p className="mt-0.5 text-[10px] text-[#6B7280]">PNG, JPG, JPEG or WEBP</p></div>
                </button>
              ) : (
                <div className="rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-[76px] w-[58px] shrink-0 overflow-hidden rounded-xl border border-[#DCE6F2] bg-white"><img src={thumbnailPreview} alt={title || "Reel thumbnail"} className="h-full w-full object-cover" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#111827]">{thumbnailFile?.name || "Current thumbnail"}</p>
                      <p className="mt-0.5 text-[10px] text-[#6B7280]">{thumbnailFile ? "New thumbnail selected" : "Current uploaded thumbnail"}</p>
                      <div className="mt-2 flex gap-3">
                        <button type="button" onClick={() => thumbnailInputRef.current?.click()} disabled={loading} className="text-xs font-semibold text-[#2D6FE8] hover:underline">Change Thumbnail</button>
                        {thumbnailFile && <button type="button" onClick={resetThumbnail} disabled={loading} className="text-xs font-semibold text-[#C23B32] hover:underline">Reset</button>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between"><p className="text-xs font-semibold text-[#6B7280]">Live Preview</p><span className="text-[10px] text-[#6B7280]">Reel card</span></div>
              <div className="overflow-hidden rounded-[18px] bg-[#0B1228]">
                <div className="relative aspect-[9/12] max-h-[320px] w-full">
                  {videoPreview ? <video src={videoPreview} poster={thumbnailPreview || undefined} controls playsInline className="h-full w-full object-cover" /> : thumbnailPreview ? <img src={thumbnailPreview} alt="Preview" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center text-white"><FiFilm size={32} className="text-[#FACC15]" /><p className="mt-3 text-xs font-semibold">Reel Preview</p></div>}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                    <p className="text-[10px] font-medium text-white/70">{creatorHandle || "Creator handle"}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{title || "Reel title"}</h3>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-white/70"><FiUsers size={11} />{Number(followersCount || 0).toLocaleString("en-IN")} followers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#DCE6F2] bg-white px-5 py-4">
          <button type="button" onClick={handleClose} disabled={loading} className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#6B7280] transition hover:bg-[#F4F8FD] disabled:opacity-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="flex min-w-[125px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <><FiRefreshCw size={14} className="animate-spin" />{mode === "add" ? "Creating..." : "Updating..."}</> : mode === "add" ? <><FiPlus size={15} />Create Reel</> : <><FiCheckCircle size={15} />Update Reel</>}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// DELETE MODAL
// =====================================================
const DeleteReelModal: React.FC<DeleteReelModalProps> = ({ open, loading, reel, onClose, onConfirm }) => (
  <GlobalModal isOpen={open} onClose={() => { if (!loading) onClose(); }} closeOnOverlayClick={!loading} title="">
    <div className="w-full max-w-[430px] overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
      <div className="h-[3px] bg-gradient-to-r from-[#FACC15] to-[#C23B32]" />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#C23B32]"><FiTrash2 size={19} /></div>
          <div className="min-w-0 flex-1"><h2 className="text-lg font-semibold text-[#111827]">Delete Reel?</h2><p className="mt-1.5 text-xs leading-5 text-[#6B7280]">This action will permanently remove the selected reel.</p></div>
          <button type="button" onClick={onClose} disabled={loading} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#EAF3FF]"><FiX size={17} /></button>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
          <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-[#0B1228]">{reel && getThumbnailUrl(reel) ? <img src={getThumbnailUrl(reel)} alt={reel.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#FACC15]"><FiFilm size={18} /></div>}</div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#111827]">{reel?.title || "Selected Reel"}</p><p className="mt-0.5 text-xs text-[#6B7280]">{reel?.creator_handle ? `@${reel.creator_handle}` : "Reel"}</p>{getProductSlug(reel) && <p className="mt-0.5 truncate text-[10px] font-medium text-[#2D6FE8]">{getProductSlug(reel)}</p>}</div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4">
        <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#6B7280] transition hover:bg-[#F4F8FD] disabled:opacity-50">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={loading} className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#C23B32] to-[#A62F27] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.6)] transition hover:-translate-y-0.5 disabled:opacity-50">{loading ? <><FiRefreshCw size={14} className="animate-spin" />Deleting...</> : <><FiTrash2 size={14} />Delete Reel</>}</button>
      </div>
    </div>
  </GlobalModal>
);

// =====================================================
// REEL CARD
// =====================================================
const ReelCard: React.FC<ReelCardProps> = ({ reel, serialNumber, canEdit, canDelete, onEdit, onDelete }) => {
  const thumbnail = getThumbnailUrl(reel);
  const video = getVideoUrl(reel);

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -3 }} className="group flex flex-col overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white font-poppins shadow-sm transition-all duration-300 hover:border-[#2D6FE8]/30 hover:shadow-[0_15px_35px_rgba(45,111,232,0.09)]">
      <div className="relative aspect-[9/11] overflow-hidden bg-[#0B1228]">
        {video ? <video src={video} poster={thumbnail || undefined} muted playsInline preload="metadata" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" /> : thumbnail ? <img src={thumbnail} alt={reel.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" /> : <div className="flex h-full w-full items-center justify-center"><FiFilm size={35} className="text-[#FACC15]" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />
        <span className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-bold ${reel.is_published ? "bg-white/95 text-[#2D6FE8]" : "bg-black/60 text-white"}`}><span className={`h-1.5 w-1.5 rounded-full ${reel.is_published ? "bg-[#2D6FE8]" : "bg-[#FACC15]"}`} />{reel.is_published ? "Published" : "Draft"}</span>
        <span className="absolute left-3 top-3 rounded-lg bg-black/55 px-2 py-1 text-[9px] font-bold text-white">#{serialNumber}</span>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-[10px] font-medium text-white/65">{reel.creator_handle}</p>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5">{reel.title}</h3>
          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-white/65"><span className="flex items-center gap-1.5"><FiUsers size={11} />{Number(reel.followers_count || 0).toLocaleString("en-IN")}</span><span>{formatDate(reel.created_at)}</span></div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Product</p>{reel.product && getProductSlug(reel) ? <a href={getProductLink(reel)} className="mt-1 block truncate text-xs font-semibold text-[#2D6FE8] underline-offset-2 transition hover:text-[#1D4ED8] hover:underline" title={getProductSlug(reel)}>{getProductSlug(reel)}</a> : <p className="mt-1 truncate text-xs font-semibold text-[#6B7280]">No product linked</p>}</div>
          <span className="shrink-0 rounded-lg bg-[#EAF3FF] px-2.5 py-1.5 text-[9px] font-bold text-[#2D6FE8]">Reel #{serialNumber}</span>
        </div>

        <div className="mt-auto mt-4 flex items-center justify-between gap-2 border-t border-[#DCE6F2] pt-3">
          <div className="flex min-w-0 items-center gap-2 text-[10px] text-[#6B7280]">{reel.video_url ? <><FiLink size={12} /><span>External URL</span></> : <><FiFilm size={12} /><span>Uploaded Video</span></>}</div>
          <div className="flex shrink-0 items-center gap-2">
            {canEdit && <button type="button" onClick={() => onEdit(reel)} title="Edit / Update Reel" aria-label={`Edit reel ${reel.title}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF] hover:text-[#1D4ED8]"><FiEdit2 size={14} /></button>}
            {canDelete && <button type="button" onClick={() => onDelete(reel)} title="Delete Reel" aria-label={`Delete reel ${reel.title}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#6B7280] transition hover:border-[#C23B32] hover:bg-[#FEF2F2] hover:text-[#C23B32]"><FiTrash2 size={14} /></button>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================
const ReelsManagement: React.FC = () => {
  const { hasPermission, isSuperAdmin, loading: permissionsLoading } = usePermissions();
  const hasAnyPermission = (permissionKeys: string[]) => permissionKeys.some((key) => hasPermission(key));

  const canViewReels = isSuperAdmin || hasAnyPermission(VIEW_PERMISSION_KEYS);
  const canCreateReels = isSuperAdmin || hasAnyPermission(CREATE_PERMISSION_KEYS);
  const canUpdateReels = isSuperAdmin || hasAnyPermission(UPDATE_PERMISSION_KEYS);
  const canDeleteReels = isSuperAdmin || hasAnyPermission(DELETE_PERMISSION_KEYS);

  // ===================================================
  // LOGO STATE (same pattern as Orders / ReturnRefund / CreditNotes / Payment)
  // ===================================================

  const [logoUrl, setLogoUrl] = useState<string | null>(DEFAULT_LOGO_URL);
  const [logoLoading, setLogoLoading] = useState(true);

  const [reels, setReels] = useState<Reel[]>([]);
  const [products, setProducts] = useState<ReelProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // ✅ first load only — subsequent fetches don't block page
  const [initialReelsLoading, setInitialReelsLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

  const reelsFetchInFlightRef = useRef<Promise<void> | null>(null);
  const productsFetchInFlightRef = useRef<Promise<void> | null>(null);
  const hasInitialReelsFetchRef = useRef(false);
  const hasInitialProductsFetchRef = useRef(false);

  // ===================================================
  // LOGO FETCH (same as Orders / ReturnRefund / CreditNotes / Payment)
  // ===================================================

  useEffect(() => {
    let cancelled = false;

    const fetchLogo = async () => {
      try {
        const response: any = await logoApi.getLogo();

        const possibleLogos: unknown[] = [
          response?.data?.data?.logo,
          response?.data?.logo,
          response?.data?.data?.data?.logo,
          response?.data?.data?.logo_url,
          response?.data?.logo_url,
          response?.logo,
        ];

        const resolvedLogo = possibleLogos.find(
          (value): value is string =>
            typeof value === "string" && /^https?:\/\//i.test(value.trim()),
        );

        if (!cancelled && resolvedLogo) {
          setLogoUrl(resolvedLogo.trim());
        }
      } catch (error) {
        console.error("Logo API error:", error);
      } finally {
        if (!cancelled) {
          setLogoLoading(false);
        }
      }
    };

    void fetchLogo();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===================================================
  // FETCH REELS
  // isInitialLoad = true ONLY FOR THE FIRST LOAD
  // ===================================================
  const fetchReels = async (force = false, isInitialLoad = false): Promise<void> => {
    if (reelsFetchInFlightRef.current) return reelsFetchInFlightRef.current;
    if (!force && hasInitialReelsFetchRef.current) return;
    if (!canViewReels) return;

    const requestPromise = (async () => {
      try {
        setLoading(true);
        const response = await reelsApi.getAll();
        const data = response.data?.data;
        if (Array.isArray(data)) {
          setReels(data);
          hasInitialReelsFetchRef.current = true;
        } else {
          setReels([]);
          toast.error(response.data?.message || "Unable to fetch reels.");
        }
      } catch (error: any) {
        console.error("Fetch reels error:", error);
        toast.error(error?.response?.data?.message || "Unable to fetch reels.");
      } finally {
        setLoading(false);

        if (isInitialLoad) {
          setInitialReelsLoading(false);
        }
      }
    })();

    reelsFetchInFlightRef.current = requestPromise;
    try {
      await requestPromise;
    } finally {
      reelsFetchInFlightRef.current = null;
    }
  };

  const fetchProducts = async (force = false): Promise<void> => {
    if (productsFetchInFlightRef.current) return productsFetchInFlightRef.current;
    if (!force && hasInitialProductsFetchRef.current) return;
    if (!canCreateReels && !canUpdateReels) return;

    const requestPromise = (async () => {
      try {
        setProductsLoading(true);
        const response = await productApi.getProducts();
        let productData: any[] = [];
        if (response?.data?.data?.data) productData = response.data.data.data;
        else if (response?.data?.data) productData = response.data.data;
        else if (response?.data) productData = response.data;
        else if (Array.isArray(response)) productData = response;
        const productsArray = Array.isArray(productData) ? productData.filter((item: any) => item?.id) : [];
        const mappedProducts: ReelProduct[] = productsArray.map((product: any) => ({
          id: Number(product.id),
          name: product.name,
          slug: product.slug,
          product_code: product.product_code,
          product_link: product.product_link,
        }));
        setProducts(mappedProducts);
        hasInitialProductsFetchRef.current = true;
      } catch (error: any) {
        console.error("Fetch products error:", error);
        toast.error(error?.response?.data?.message || "Unable to fetch products.");
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    })();

    productsFetchInFlightRef.current = requestPromise;
    try {
      await requestPromise;
    } finally {
      productsFetchInFlightRef.current = null;
    }
  };

  // ===================================================
  // INITIAL FETCH
  // WAIT FOR PERMISSIONS BEFORE REQUESTING REELS
  // ===================================================
  useEffect(() => {
    if (permissionsLoading) return;
    if (canViewReels && !hasInitialReelsFetchRef.current) {
      void fetchReels(false, true);
    } else if (!canViewReels) {
      setLoading(false);
      setInitialReelsLoading(false);
    }
    if (canCreateReels || canUpdateReels) void fetchProducts();
    // Fetch functions intentionally run when permission state becomes available/changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canViewReels, canCreateReels, canUpdateReels]);

  // ===================================================
  // COMBINED INITIAL LOADING
  // ===================================================

  const pageLoading =
    permissionsLoading ||
    logoLoading ||
    initialReelsLoading;

  const filteredReels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reels;
    return reels.filter((reel) =>
      reel.title?.toLowerCase().includes(query) ||
      reel.creator_handle?.toLowerCase().includes(query) ||
      String(reel.id).includes(query) ||
      String(reel.product?.id || "").includes(query) ||
      String(reel.product?.name || "").toLowerCase().includes(query) ||
      getProductSlug(reel).toLowerCase().includes(query),
    );
  }, [reels, search]);

  const openAdd = () => {
    if (!canCreateReels) return void toast.error("You do not have permission to create reels.");
    setSelectedReel(null);
    setModalMode("add");
    setAddEditOpen(true);
  };

  const openEdit = (reel: Reel) => {
    if (!canUpdateReels) return void toast.error("You do not have permission to update reels.");
    setSelectedReel(reel);
    setModalMode("edit");
    setAddEditOpen(true);
    if (!hasInitialProductsFetchRef.current) void fetchProducts();
  };

  const openDelete = (reel: Reel) => {
    if (!canDeleteReels) return void toast.error("You do not have permission to delete reels.");
    setSelectedReel(reel);
    setDeleteOpen(true);
  };

  const handleRefresh = async () => {
    if (!canViewReels) return void toast.error("You do not have permission to view reels.");
    if (loading) return;
    await fetchReels(true);
    toast.success("Reels refreshed.");
  };

  const handleSave = async (payload: FormData) => {
    const allowed = modalMode === "add" ? canCreateReels : canUpdateReels;
    if (!allowed) return void toast.error(`You do not have permission to ${modalMode === "add" ? "create" : "update"} reels.`);
    if (saveLoading) return;

    try {
      setSaveLoading(true);
      const response = modalMode === "edit" && selectedReel
        ? await reelsApi.update(selectedReel.id, payload)
        : await reelsApi.create(payload);

      if (response.data?.success !== false) {
        toast.success(response.data?.message || (modalMode === "edit" ? "Reel updated successfully." : "Reel created successfully."));
        setAddEditOpen(false);
        setSelectedReel(null);
        await fetchReels(true);
      } else {
        toast.error(response.data?.message || "Unable to save reel.");
      }
    } catch (error: any) {
      console.error("Save reel error:", error);
      toast.error(error?.response?.data?.message || "Something went wrong while saving reel.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDeleteReels) return void toast.error("You do not have permission to delete reels.");
    if (deleteLoading || !selectedReel) return;

    try {
      setDeleteLoading(true);
      const response = await reelsApi.delete(selectedReel.id);
      if (response.data?.success !== false) {
        toast.success(response.data?.message || "Reel deleted successfully.");
        setDeleteOpen(false);
        setSelectedReel(null);
        await fetchReels(true);
      } else {
        toast.error(response.data?.message || "Unable to delete reel.");
      }
    } catch (error: any) {
      console.error("Delete reel error:", error);
      toast.error(error?.response?.data?.message || "Something went wrong while deleting reel.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  if (!canViewReels) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
        <div className="rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-sm">
          <FiAlertCircle size={30} className="mx-auto text-[#C23B32]" />
          <h2 className="mt-3 text-base font-semibold text-[#111827]">Access denied</h2>
          <p className="mt-1 text-sm text-[#6B7280]">You do not have permission to view reels.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="min-h-screen bg-[#F4F8FD] px-4 py-5 font-poppins sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <motion.div variants={itemVariants} className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-1.5 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" /><span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" /><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2D6FE8]">Content Management</span></div>
            <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">Reels</h1>
            <p className="mt-0.5 text-sm text-[#111827]">Manage social reels, creators, videos and thumbnails.</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleRefresh} disabled={loading} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm font-medium text-[#6B7280] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"><FiRefreshCw size={15} className={loading ? "animate-spin" : ""} /><span className="hidden sm:inline">Refresh</span></button>
            {canCreateReels && <button type="button" onClick={openAdd} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.7)]"><FiPlus size={16} />Add Reel</button>}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]">
          <div className="flex flex-col gap-4 border-b border-[#DCE6F2] p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
            <div><h2 className="text-base font-semibold text-[#111827]">Reel Directory</h2><p className="mt-1 text-xs text-[#6B7280]">{filteredReels.length} {filteredReels.length === 1 ? "reel" : "reels"} found</p></div>
            <div className="relative w-full md:max-w-sm"><FiSearch size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reels, creator or ID..." className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-10 pr-10 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-3 top-1/2 flex -translate-y-1/2 text-[#6B7280] hover:text-[#2D6FE8]"><FiX size={16} /></button>}</div>
          </div>

          {/* ✅ initialReelsLoading par full spinner — refresh/CRUD par nahi */}
          {initialReelsLoading ? (
            <div className="flex flex-col items-center px-5 py-20 text-center sm:px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiRefreshCw size={22} className="animate-spin" />
              </div>
              <p className="mt-4 text-sm font-bold text-[#111827]">Loading reels...</p>
            </div>
          ) : loading && reels.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-20 text-center sm:px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiRefreshCw size={22} className="animate-spin" />
              </div>
              <p className="mt-4 text-sm font-bold text-[#111827]">Loading reels...</p>
            </div>
          ) : filteredReels.length === 0 ? (
            <div className="px-5 py-20 text-center sm:px-6"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]"><FiFilm size={27} /></div><h3 className="mt-5 text-base font-semibold text-[#111827]">{search ? "No reels found" : "No reels available"}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6B7280]">{search ? "Try searching with another title, creator or reel ID." : "Add your first reel to start managing social content."}</p>{!search && canCreateReels && <button type="button" onClick={openAdd} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.5)] transition hover:-translate-y-0.5"><FiPlus size={16} />Add Reel</button>}</div>
          ) : (
            <div className="p-5 sm:p-6"><motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredReels.map((reel, index) => <ReelCard key={reel.id} reel={reel} serialNumber={index + 1} canEdit={canUpdateReels} canDelete={canDeleteReels} onEdit={openEdit} onDelete={openDelete} />)}</motion.div></div>
          )}
        </motion.div>
      </div>

      <ReelFormModal open={addEditOpen} loading={saveLoading} mode={modalMode} reel={selectedReel} products={products} productsLoading={productsLoading} canSubmit={modalMode === "add" ? canCreateReels : canUpdateReels} onClose={() => { if (!saveLoading) { setAddEditOpen(false); setSelectedReel(null); } }} onSubmit={handleSave} />
      <DeleteReelModal open={deleteOpen} loading={deleteLoading} reel={selectedReel} onClose={() => { if (!deleteLoading) { setDeleteOpen(false); setSelectedReel(null); } }} onConfirm={handleDelete} />
    </motion.div>
  );
};

export default ReelsManagement;