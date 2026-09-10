"use client";

import React, {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import {
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
  FiCheckCircle,
} from "react-icons/fi";

import GlobalModal from "@/components/common/GlobalModal";

import reelsApi, { Reel } from "../../api/endpoints/reels";
import { productApi } from "../../api/endpoints/product";

const PAGE_BG = "#F5F7F5";

// =====================================================
// ANIMATIONS
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
    transition: { type: "spring", stiffness: 110, damping: 16 },
  },
};

// =====================================================
// TYPES
// =====================================================

interface ReelProduct {
  id: number;
  name?: string | null;
  slug?: string | null;
  product_code?: string | null;
}

interface ReelFormModalProps {
  open: boolean;
  loading: boolean;
  mode: "add" | "edit";
  reel: Reel | null;
  products: ReelProduct[];
  productsLoading: boolean;
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

// =====================================================
// URL HELPERS
// =====================================================

const getVideoUrl = (reel: Reel | null) => {
  if (!reel) return "";
  return (
    reel.video_full_path ||
    reel.video_full_url ||
    reel.video_url ||
    reel.video_path ||
    ""
  );
};

const getThumbnailUrl = (reel: Reel | null) => {
  if (!reel) return "";
  return reel.thumbnail_url || reel.thumbnail || "";
};

const getReelProduct = (reel: Reel | null) =>
  (reel?.product || null) as
    (ReelProduct & { product_link?: string | null }) | null;

const getProductSlug = (reel: Reel | null) => getReelProduct(reel)?.slug || "";

const getProductLink = (reel: Reel | null) => {
  const product = getReelProduct(reel);
  if (!product) return "";
  return (
    product.product_link || (product.slug ? `/products/${product.slug}` : "")
  );
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

// =====================================================
// FORM MODAL
// =====================================================

const ReelFormModal: React.FC<ReelFormModalProps> = ({
  open,
  loading,
  mode,
  reel,
  products,
  productsLoading,
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

    return () => {
      cleanupPreviewUrls();
    };
  }, [open, mode, reel]);

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video size should be less than 50MB.");
      return;
    }

    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    videoObjectUrlRef.current = url;
    setVideoFile(file);
    setVideoPreview(url);
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Thumbnail size should be less than 5MB.");
      return;
    }

    if (thumbnailObjectUrlRef.current) {
      URL.revokeObjectURL(thumbnailObjectUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    thumbnailObjectUrlRef.current = url;
    setThumbnailFile(file);
    setThumbnailPreview(url);
  };

  const resetVideo = () => {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }

    setVideoFile(null);

    if (mode === "edit" && reel) {
      setVideoPreview(getVideoUrl(reel));
    } else {
      setVideoPreview("");
    }

    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const resetThumbnail = () => {
    if (thumbnailObjectUrlRef.current) {
      URL.revokeObjectURL(thumbnailObjectUrlRef.current);
      thumbnailObjectUrlRef.current = null;
    }

    setThumbnailFile(null);

    if (mode === "edit" && reel) {
      setThumbnailPreview(getThumbnailUrl(reel));
    } else {
      setThumbnailPreview("");
    }

    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    const trimmedCreator = creatorHandle.trim();
    const trimmedFollowers = followersCount.trim();
    const followers = Number(trimmedFollowers);
    const parsedProductId = productId.trim() ? Number(productId) : null;
    const parsedSortOrder = sortOrder.trim() ? Number(sortOrder) : 1;

    if (!trimmedTitle) {
      toast.error("Please enter reel title.");
      return;
    }

    if (!trimmedCreator) {
      toast.error("Please enter creator handle.");
      return;
    }

    if (!trimmedFollowers) {
      toast.error("Please enter followers count.");
      return;
    }

    if (Number.isNaN(followers) || followers < 0) {
      toast.error("Please enter valid followers count.");
      return;
    }

    if (productId.trim() && (!parsedProductId || parsedProductId <= 0)) {
      toast.error("Please select a valid product.");
      return;
    }

    if (Number.isNaN(parsedSortOrder) || parsedSortOrder < 0) {
      toast.error("Please enter valid sort order.");
      return;
    }

    if (mode === "add" && !videoFile && !videoUrl.trim()) {
      toast.error("Please upload a video or enter video URL.");
      return;
    }

    if (mode === "add" && !thumbnailFile) {
      toast.error("Please upload thumbnail.");
      return;
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

    if (videoFile instanceof File) {
      formData.append("video", videoFile, videoFile.name);
    }

    if (videoUrl.trim()) {
      formData.append("video_url", videoUrl.trim());
    }

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

  return (
    <GlobalModal
      isOpen={open}
      onClose={handleClose}
      closeOnOverlayClick={!loading}
      title=""
    >
      <div className="w-full max-w-[650px] overflow-hidden rounded-[20px] border border-[#E5EAE5] bg-white shadow-2xl">
        {/* TOP LINE */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-[#163F20]/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
              <FiFilm size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#202721]">
                {mode === "add" ? "Add Reel" : "Update Reel"}
              </h2>

              <p className="mt-0.5 text-xs text-[#59645C]">
                {mode === "add"
                  ? "Create a new social reel."
                  : "Update reel content and details."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#59645C] transition hover:bg-[#EAF3EA] hover:text-[#163F20] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[76vh] overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            {/* TITLE */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#3F4A41]">
                Reel Title <span className="ml-1 text-[#C23B32]">*</span>
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                placeholder="Enter Your reel title"
                className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10"
              />
            </div>

            {/* CREATOR + FOLLOWERS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#3F4A41]">
                  Creator Handle <span className="ml-1 text-[#C23B32]">*</span>
                </label>

                <input
                  type="text"
                  value={creatorHandle}
                  onChange={(e) => setCreatorHandle(e.target.value)}
                  disabled={loading}
                  placeholder="Enter Your creator Name"
                  className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#3F4A41]">
                  Followers Count
                </label>

                <div className="relative">
                  <FiUsers
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
                  />

                  <input
                    type="number"
                    min="0"
                    value={followersCount}
                    onChange={(e) => setFollowersCount(e.target.value)}
                    disabled={loading}
                    placeholder="100"
                    className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white pl-10 pr-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10"
                  />
                </div>
              </div>
            </div>

            {/* SORT ORDER */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#3F4A41]">
                Sort Order
              </label>

              <input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                disabled={loading}
                placeholder="1"
                className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10"
              />

              <p className="mt-1 text-[10px] text-[#9AA29C]">
                Controls the display order of the reel.
              </p>
            </div>

            {/* PRODUCT */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#3F4A41]">
                Product
              </label>

              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={loading || productsLoading}
                className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 text-sm text-[#202721] outline-none transition focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10 disabled:cursor-not-allowed disabled:bg-[#F5F7F5]"
              >
                <option value="">
                  {productsLoading
                    ? "Loading products..."
                    : "Select the product for your reel"}
                </option>

                {products.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.name ||
                      product.product_code ||
                      product.slug ||
                      `Product ${product.id}`}
                    {product.slug && product.name ? ` — ${product.slug}` : ""}
                  </option>
                ))}
              </select>

              <p className="mt-1 text-[10px] text-[#9AA29C]">
                Select a product to link with this reel.
              </p>
            </div>

            {/* PUBLISHED */}
            <div className="flex items-center justify-between rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-[#202721]">
                  Publish Reel
                </p>

                <p className="mt-0.5 text-[10px] text-[#9AA29C]">
                  Published reels are visible on the website.
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => setIsPublished((value) => !value)}
                className={`relative h-6 w-11 rounded-full transition ${
                  isPublished ? "bg-[#163F20]" : "bg-[#D8E2D8]"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                    isPublished ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* VIDEO URL */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#3F4A41]">
                Video URL
              </label>

              <div className="relative">
                <FiLink
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
                />

                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  disabled={loading}
                  placeholder="https://www.youtube.com/shorts/..."
                  className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white pl-10 pr-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10"
                />
              </div>
            </div>

            {/* VIDEO UPLOAD */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#3F4A41]">
                  Video File
                  {mode === "add" && (
                    <span className="ml-1 text-[#C23B32]">*</span>
                  )}
                </label>

                <span className="text-[10px] text-[#9AA29C]">Max 50MB</span>
              </div>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                disabled={loading}
                className="hidden"
              />

              {!videoPreview ? (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-4 rounded-xl border border-dashed border-[#D8E2D8] bg-[#F5F7F5] px-5 py-7 transition hover:border-[#163F20] hover:bg-[#EAF3EA]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                    <FiUpload size={19} />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#3F4A41]">
                      Upload Reel Video
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#9AA29C]">
                      MP4, MOV, WEBM or other supported video
                    </p>
                  </div>
                </button>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                  <div className="flex gap-3">
                    <div className="h-[90px] w-[70px] shrink-0 overflow-hidden rounded-xl bg-black">
                      <video
                        src={videoPreview}
                        className="h-full w-full object-cover"
                        controls
                        playsInline
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#202721]">
                        {videoFile?.name || "Current reel video"}
                      </p>

                      <p className="mt-1 text-[10px] text-[#9AA29C]">
                        {videoFile
                          ? "New video selected"
                          : "Current uploaded video"}
                      </p>

                      <div className="mt-3 flex gap-3">
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={loading}
                          className="text-xs font-semibold text-[#163F20] hover:underline"
                        >
                          Change Video
                        </button>

                        {videoFile && (
                          <button
                            type="button"
                            onClick={resetVideo}
                            disabled={loading}
                            className="text-xs font-semibold text-[#C23B32] hover:underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* THUMBNAIL */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#3F4A41]">
                  Thumbnail
                  {mode === "add" && (
                    <span className="ml-1 text-[#C23B32]">*</span>
                  )}
                </label>

                <span className="text-[10px] text-[#9AA29C]">Max 5MB</span>
              </div>

              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleThumbnailChange}
                disabled={loading}
                className="hidden"
              />

              {!thumbnailPreview ? (
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-4 rounded-xl border border-dashed border-[#D8E2D8] bg-[#F5F7F5] px-5 py-7 transition hover:border-[#163F20] hover:bg-[#EAF3EA]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
                    <FiImage size={19} />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#3F4A41]">
                      Upload Thumbnail
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#9AA29C]">
                      PNG, JPG, JPEG or WEBP
                    </p>
                  </div>
                </button>
              ) : (
                <div className="rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-[76px] w-[58px] shrink-0 overflow-hidden rounded-xl border border-[#D8E2D8] bg-white">
                      <img
                        src={thumbnailPreview}
                        alt={title || "Reel thumbnail"}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#202721]">
                        {thumbnailFile?.name || "Current thumbnail"}
                      </p>

                      <p className="mt-0.5 text-[10px] text-[#9AA29C]">
                        {thumbnailFile
                          ? "New thumbnail selected"
                          : "Current uploaded thumbnail"}
                      </p>

                      <div className="mt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() => thumbnailInputRef.current?.click()}
                          disabled={loading}
                          className="text-xs font-semibold text-[#163F20] hover:underline"
                        >
                          Change Thumbnail
                        </button>

                        {thumbnailFile && (
                          <button
                            type="button"
                            onClick={resetThumbnail}
                            disabled={loading}
                            className="text-xs font-semibold text-[#C23B32] hover:underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LIVE PREVIEW */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-semibold text-[#3F4A41]">
                  Live Preview
                </p>

                <span className="text-[10px] text-[#9AA29C]">Reel card</span>
              </div>

              <div className="overflow-hidden rounded-[18px] bg-[#161412]">
                <div className="relative aspect-[9/12] max-h-[320px] w-full">
                  {videoPreview ? (
                    <video
                      src={videoPreview}
                      poster={thumbnailPreview || undefined}
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-white">
                      <FiFilm size={32} className="text-[#8FC199]" />

                      <p className="mt-3 text-xs font-semibold">Reel Preview</p>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                    <p className="text-[10px] font-medium text-white/70">
                      {creatorHandle || "Creator handle"}
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {title || "Reel title"}
                    </h3>

                    <div className="mt-2 flex items-center gap-2 text-[10px] text-white/70">
                      <FiUsers size={11} />
                      {Number(followersCount || 0).toLocaleString("en-IN")}{" "}
                      followers
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-[#163F20]/10 bg-white px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl border border-[#D8E2D8] bg-white px-5 py-2.5 text-sm font-medium text-[#3F4A41] transition hover:bg-[#F5F7F5] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex min-w-[125px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <FiRefreshCw size={14} className="animate-spin" />
                {mode === "add" ? "Creating..." : "Updating..."}
              </>
            ) : mode === "add" ? (
              <>
                <FiPlus size={15} />
                Create Reel
              </>
            ) : (
              <>
                <FiCheckCircle size={15} />
                Update Reel
              </>
            )}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// DELETE MODAL
// =====================================================

const DeleteReelModal: React.FC<DeleteReelModalProps> = ({
  open,
  loading,
  reel,
  onClose,
  onConfirm,
}) => {
  return (
    <GlobalModal
      isOpen={open}
      onClose={() => {
        if (!loading) onClose();
      }}
      closeOnOverlayClick={!loading}
      title=""
    >
      <div className="w-full max-w-[430px] overflow-hidden rounded-[20px] border border-[#C23B32]/15 bg-white shadow-2xl">
        <div className="h-[3px] bg-gradient-to-r from-[#4C8A57] to-[#C23B32]" />

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FBEAEA] text-[#C23B32]">
              <FiTrash2 size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-[#202721]">
                Delete Reel?
              </h2>

              <p className="mt-1.5 text-xs leading-5 text-[#59645C]">
                This action will permanently remove the selected reel.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#59645C] hover:bg-[#EAF3EA]"
            >
              <FiX size={17} />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
            <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-black">
              {reel && getThumbnailUrl(reel) ? (
                <img
                  src={getThumbnailUrl(reel)}
                  alt={reel.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[#8FC199]">
                  <FiFilm size={18} />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#202721]">
                {reel?.title || "Selected Reel"}
              </p>

              <p className="mt-0.5 text-xs text-[#59645C]">
                {reel?.creator_handle ? `@${reel.creator_handle}` : "Reel"}
              </p>

              {getProductSlug(reel) && (
                <p className="mt-0.5 truncate text-[10px] font-medium text-[#163F20]">
                  {getProductSlug(reel)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#163F20]/10 bg-[#FAFBFA] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-[#D8E2D8] bg-white px-5 py-2.5 text-sm font-medium text-[#3F4A41] transition hover:bg-[#F5F7F5] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#C23B32] to-[#A62F27] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.6)] transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <FiRefreshCw size={14} className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <FiTrash2 size={14} />
                Delete Reel
              </>
            )}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// REEL CARD
// =====================================================

interface ReelCardProps {
  reel: Reel;
  serialNumber: number;
  onEdit: (reel: Reel) => void;
  onDelete: (reel: Reel) => void;
}

const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  serialNumber,
  onEdit,
  onDelete,
}) => {
  const thumbnail = getThumbnailUrl(reel);
  const video = getVideoUrl(reel);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      className="group overflow-hidden rounded-[18px] border border-[#E5EAE5] bg-white shadow-sm transition-all duration-300 hover:border-[#163F20]/30 hover:shadow-[0_15px_35px_rgba(22,63,32,0.08)]"
    >
      {/* VIDEO / IMAGE */}
      <div className="relative aspect-[9/11] overflow-hidden bg-[#161412]">
        {video ? (
          <video
            src={video}
            poster={thumbnail || undefined}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={reel.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FiFilm size={35} className="text-[#8FC199]" />
          </div>
        )}

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />

        {/* PUBLISHED */}
        <span
          className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-bold ${
            reel.is_published
              ? "bg-white/95 text-[#163F20]"
              : "bg-black/60 text-white"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              reel.is_published ? "bg-[#163F20]" : "bg-[#D8E2D8]"
            }`}
          />

          {reel.is_published ? "Published" : "Draft"}
        </span>

        {/* SERIAL NUMBER */}
        <span className="absolute left-3 top-3 rounded-lg bg-black/55 px-2 py-1 text-[9px] font-bold text-white">
          #{serialNumber}
        </span>

        {/* BOTTOM CONTENT */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-[10px] font-medium text-white/65">
            {reel.creator_handle}
          </p>

          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5">
            {reel.title}
          </h3>

          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-white/65">
            <span className="flex items-center gap-1.5">
              <FiUsers size={11} />
              {Number(reel.followers_count || 0).toLocaleString("en-IN")}
            </span>

            <span>{formatDate(reel.created_at)}</span>
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
              Product
            </p>

            {reel.product && getProductSlug(reel) ? (
              <a
                href={getProductLink(reel)}
                className="mt-1 block truncate text-xs font-semibold text-[#163F20] underline-offset-2 transition hover:text-[#0F3219] hover:underline"
                title={getProductSlug(reel)}
              >
                {getProductSlug(reel)}
              </a>
            ) : (
              <p className="mt-1 truncate text-xs font-semibold text-[#9AA29C]">
                No product linked
              </p>
            )}
          </div>

          <span className="shrink-0 rounded-lg bg-[#EAF3EA] px-2.5 py-1.5 text-[9px] font-bold text-[#163F20]">
            Reel #{serialNumber}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#163F20]/10 pt-3">
          <div className="flex items-center gap-2 text-[10px] text-[#9AA29C]">
            {reel.video_url ? (
              <>
                <FiLink size={12} />
                External URL
              </>
            ) : (
              <>
                <FiFilm size={12} />
                Uploaded Video
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(reel)}
              title="Edit Reel"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2D8] bg-white text-[#59645C] transition hover:border-[#163F20] hover:text-[#163F20]"
            >
              <FiEdit2 size={14} />
            </button>

            <button
              type="button"
              onClick={() => onDelete(reel)}
              title="Delete Reel"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2D8] bg-white text-[#59645C] transition hover:border-[#C23B32] hover:text-[#C23B32]"
            >
              <FiTrash2 size={14} />
            </button>
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
  const [reels, setReels] = useState<Reel[]>([]);
  const [products, setProducts] = useState<ReelProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

  // =================================================
  // FETCH REELS
  // =================================================

  const fetchReels = async () => {
    try {
      setLoading(true);

      const response = await reelsApi.getAll();

      if (response.data?.data) {
        setReels(response.data.data);
      } else {
        setReels([]);
        toast.error(response.data?.message || "Unable to fetch reels.");
      }
    } catch (error: any) {
      console.error("Fetch reels error:", error);
      toast.error(error?.response?.data?.message || "Unable to fetch reels.");
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // FETCH PRODUCTS
  // =================================================

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);

      const response = await productApi.getProducts();

      let productData = [];

      if (response?.data?.data?.data) {
        productData = response.data.data.data;
      } else if (response?.data?.data) {
        productData = response.data.data;
      } else if (response?.data) {
        productData = response.data;
      } else if (Array.isArray(response)) {
        productData = response;
      }

      const productsArray = Array.isArray(productData)
        ? productData.filter((item: any) => item && item.id)
        : [];

      const mappedProducts = productsArray.map((product: any) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        product_code: product.product_code,
      }));

      setProducts(mappedProducts);

      if (mappedProducts.length === 0) {
        console.warn("No products found in response");
      }
    } catch (error: any) {
      console.error("Fetch products error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to fetch products.",
      );
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
    fetchProducts();
  }, []);

  // =================================================
  // SEARCH
  // =================================================

  const filteredReels = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return reels;

    return reels.filter(
      (reel) =>
        reel.title?.toLowerCase().includes(query) ||
        reel.creator_handle?.toLowerCase().includes(query) ||
        String(reel.id).includes(query) ||
        String(reel.product?.id || "").includes(query) ||
        String((reel.product as any)?.name || "")
          .toLowerCase()
          .includes(query) ||
        getProductSlug(reel).toLowerCase().includes(query),
    );
  }, [reels, search]);

  // =================================================
  // STATS
  // =================================================

  const totalReels = reels.length;
  const publishedReels = reels.filter((reel) => reel.is_published).length;
  const draftReels = reels.filter((reel) => !reel.is_published).length;

  // =================================================
  // HANDLERS
  // =================================================

  const openAdd = () => {
    setSelectedReel(null);
    setModalMode("add");
    setAddEditOpen(true);
  };

  const openEdit = (reel: Reel) => {
    setSelectedReel(reel);
    setModalMode("edit");
    setAddEditOpen(true);
  };

  const openDelete = (reel: Reel) => {
    setSelectedReel(reel);
    setDeleteOpen(true);
  };

  const handleSave = async (payload: FormData) => {
    try {
      setSaveLoading(true);

      let response;

      if (modalMode === "edit" && selectedReel) {
        response = await reelsApi.update(selectedReel.id, payload);
      } else {
        response = await reelsApi.create(payload);
      }

      if (response.data?.success !== false) {
        toast.success(
          response.data?.message ||
            (modalMode === "edit"
              ? "Reel updated successfully."
              : "Reel created successfully."),
        );

        setAddEditOpen(false);
        setSelectedReel(null);

        await fetchReels();
      } else {
        toast.error(response.data?.message || "Unable to save reel.");
      }
    } catch (error: any) {
      console.error("Save reel error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Something went wrong while saving reel.",
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReel) return;

    try {
      setDeleteLoading(true);

      const response = await reelsApi.delete(selectedReel.id);

      if (response.data?.success !== false) {
        toast.success(response.data?.message || "Reel deleted successfully.");

        setDeleteOpen(false);
        setSelectedReel(null);

        await fetchReels();
      } else {
        toast.error(response.data?.message || "Unable to delete reel.");
      }
    } catch (error: any) {
      console.error("Delete reel error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Something went wrong while deleting reel.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // =================================================
  // LOADING
  // =================================================

  if (loading && reels.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#EAF3EA] border-t-[#163F20]" />

          <p className="mt-3 text-sm text-[#59645C]">Loading reels...</p>
        </div>
      </div>
    );
  }

  // =================================================
  // UI
  // =================================================

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"
      style={{ backgroundColor: PAGE_BG }}
    >
      <div className="mx-auto max-w-[1500px]">
        {/* HEADER */}
        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"
        >
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4C8A57]">
                Content Management
              </span>
            </div>

            <h1 className="text-[29px] font-semibold tracking-tight text-[#202721] sm:text-[32px]">
              Reels
            </h1>

            <p className="mt-1 text-sm text-[#59645C]">
              Manage social reels, creators, videos and thumbnails.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchReels}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8E2D8] bg-white px-4 text-sm font-medium text-[#3F4A41] shadow-sm transition hover:bg-[#EAF3EA] hover:text-[#163F20] disabled:opacity-50"
            >
              <FiRefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={openAdd}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)]"
            >
              <FiPlus size={16} />
              Add Reel
            </button>
          </div>
        </motion.div>

        {/* STATS */}
        <motion.div
          variants={containerVariants}
          className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-[0_8px_24px_rgba(22,63,32,0.05)]"
          >
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                  Total Reels
                </p>

                <p className="mt-2 text-[26px] font-bold tracking-tight text-[#202721]">
                  {totalReels}
                </p>

                <p className="mt-1 text-[11px] text-[#59645C]">
                  All reels in library
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#EAF3EA] text-[#163F20]">
                <FiFilm size={21} />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-[0_8px_24px_rgba(22,63,32,0.05)]"
          >
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#8FC199] to-[#163F20]" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                  Published
                </p>

                <p className="mt-2 text-[26px] font-bold tracking-tight text-[#202721]">
                  {publishedReels}
                </p>

                <p className="mt-1 text-[11px] text-[#59645C]">
                  Visible on website
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#EAF3EA] text-[#163F20]">
                <FiCheckCircle size={21} />
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border border-[#E5EAE5] bg-white p-5 shadow-[0_8px_24px_rgba(22,63,32,0.05)]"
          >
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#89918B] to-[#59645C]" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                  Drafts
                </p>

                <p className="mt-2 text-[26px] font-bold tracking-tight text-[#202721]">
                  {draftReels}
                </p>

                <p className="mt-1 text-[11px] text-[#59645C]">
                  Not yet published
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#F3F6F3] text-[#59645C]">
                <FiFilm size={21} />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* MAIN CARD */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-[20px] border border-[#E5EAE5] bg-white shadow-[0_8px_30px_rgba(22,63,32,0.06)]"
        >
          <div className="h-[3px] w-full bg-gradient-to-r from-[#8FC199] via-[#163F20] to-[#0F3219]" />

          {/* TOOLBAR */}
          <div className="flex flex-col gap-4 border-b border-[#163F20]/10 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#202721]">
                Reel Directory
              </h2>

              <p className="mt-1 text-xs text-[#59645C]">
                {filteredReels.length}{" "}
                {filteredReels.length === 1 ? "reel" : "reels"} found
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <FiSearch
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reels, creator or ID..."
                className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] pl-10 pr-10 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:bg-white focus:ring-2 focus:ring-[#163F20]/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex -translate-y-1/2 text-[#9AA29C] hover:text-[#163F20]"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>

          {/* CONTENT */}
          {filteredReels.length === 0 ? (
            <div className="px-5 py-20 text-center sm:px-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF3EA] text-[#163F20]">
                <FiFilm size={27} />
              </div>

              <h3 className="mt-5 text-base font-semibold text-[#202721]">
                {search ? "No reels found" : "No reels available"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#59645C]">
                {search
                  ? "Try searching with another title, creator or reel ID."
                  : "Add your first reel to start managing social content."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAdd}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.5)] transition hover:-translate-y-0.5"
                >
                  <FiPlus size={16} />
                  Add Reel
                </button>
              )}
            </div>
          ) : (
            <div className="p-5 sm:p-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filteredReels.map((reel, index) => (
                  <ReelCard
                    key={reel.id}
                    reel={reel}
                    serialNumber={index + 1}
                    onEdit={openEdit}
                    onDelete={openDelete}
                  />
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ADD / EDIT MODAL */}
      <ReelFormModal
        open={addEditOpen}
        loading={saveLoading}
        mode={modalMode}
        reel={selectedReel}
        products={products}
        productsLoading={productsLoading}
        onClose={() => {
          if (!saveLoading) {
            setAddEditOpen(false);
            setSelectedReel(null);
          }
        }}
        onSubmit={handleSave}
      />

      {/* DELETE MODAL */}
      <DeleteReelModal
        open={deleteOpen}
        loading={deleteLoading}
        reel={selectedReel}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteOpen(false);
            setSelectedReel(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
};

export default ReelsManagement;
