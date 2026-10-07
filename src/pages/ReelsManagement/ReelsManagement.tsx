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
  FiAlertCircle,
} from "react-icons/fi";

import GlobalModal from "@/components/common/GlobalModal";

import reelsApi, {
  Reel,
} from "../../api/endpoints/reels";

import { productApi } from "../../api/endpoints/product";

import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// THEME - BLUE / NAVY
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
// PERMISSION COMPATIBILITY
// =====================================================

const VIEW_PERMISSION_KEYS = [
  "reels.view",
  "reel.view",
  "Reels.view",
  "Reel.view",
];

const CREATE_PERMISSION_KEYS = [
  "reels.create",
  "reel.create",
  "Reels.create",
  "Reel.create",
];

const UPDATE_PERMISSION_KEYS = [
  "reels.update",
  "reel.update",
  "Reels.update",
  "Reel.update",
];

const DELETE_PERMISSION_KEYS = [
  "reels.delete",
  "reel.delete",
  "Reels.delete",
  "Reel.delete",
];

// =====================================================
// ANIMATIONS
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

// =====================================================
// URL HELPERS
// =====================================================

const getVideoUrl = (
  reel: Reel | null,
) => {
  if (!reel) {
    return "";
  }

  return (
    reel.video_full_path ||
    reel.video_full_url ||
    reel.video_url ||
    reel.video_path ||
    ""
  );
};

const getThumbnailUrl = (
  reel: Reel | null,
) => {
  if (!reel) {
    return "";
  }

  return (
    reel.thumbnail_url ||
    reel.thumbnail ||
    ""
  );
};

const getReelProduct = (
  reel: Reel | null,
) =>
  (reel?.product ||
    null) as
    | (ReelProduct & {
        product_link?: string | null;
      })
    | null;

const getProductSlug = (
  reel: Reel | null,
) =>
  getReelProduct(reel)?.slug ||
  "";

const getProductLink = (
  reel: Reel | null,
) => {
  const product =
    getReelProduct(reel);

  if (!product) {
    return "";
  }

  return (
    product.product_link ||
    (product.slug
      ? `/products/${product.slug}`
      : "")
  );
};

const formatDate = (
  value?: string | null,
) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

// =====================================================
// FORM MODAL
// =====================================================

const ReelFormModal: React.FC<
  ReelFormModalProps
> = ({
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
  const [
    title,
    setTitle,
  ] = useState("");

  const [
    creatorHandle,
    setCreatorHandle,
  ] = useState("");

  const [
    followersCount,
    setFollowersCount,
  ] = useState("");

  const [
    productId,
    setProductId,
  ] = useState("");

  const [
    isPublished,
    setIsPublished,
  ] = useState(true);

  const [
    sortOrder,
    setSortOrder,
  ] = useState("1");

  const [
    videoUrl,
    setVideoUrl,
  ] = useState("");

  const [
    videoFile,
    setVideoFile,
  ] = useState<File | null>(
    null,
  );

  const [
    thumbnailFile,
    setThumbnailFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    videoPreview,
    setVideoPreview,
  ] = useState("");

  const [
    thumbnailPreview,
    setThumbnailPreview,
  ] = useState("");

  const videoInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const thumbnailInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const videoObjectUrlRef =
    useRef<string | null>(
      null,
    );

  const thumbnailObjectUrlRef =
    useRef<string | null>(
      null,
    );

  const cleanupPreviewUrls =
    () => {
      if (
        videoObjectUrlRef.current
      ) {
        URL.revokeObjectURL(
          videoObjectUrlRef.current,
        );

        videoObjectUrlRef.current =
          null;
      }

      if (
        thumbnailObjectUrlRef.current
      ) {
        URL.revokeObjectURL(
          thumbnailObjectUrlRef.current,
        );

        thumbnailObjectUrlRef.current =
          null;
      }
    };

  useEffect(() => {
    if (!open) {
      cleanupPreviewUrls();
      return;
    }

    cleanupPreviewUrls();

    if (
      mode === "edit" &&
      reel
    ) {
      setTitle(
        reel.title || "",
      );

      setCreatorHandle(
        reel.creator_handle ||
          "",
      );

      setFollowersCount(
        String(
          reel.followers_count ??
            0,
        ),
      );

      setProductId(
        reel.product?.id
          ? String(
              reel.product.id,
            )
          : "",
      );

      setIsPublished(
        Boolean(
          reel.is_published,
        ),
      );

      setSortOrder(
        String(
          reel.sort_order ??
            1,
        ),
      );

      setVideoUrl(
        reel.video_url || "",
      );

      setVideoFile(null);

      setThumbnailFile(
        null,
      );

      setVideoPreview(
        getVideoUrl(reel),
      );

      setThumbnailPreview(
        getThumbnailUrl(
          reel,
        ),
      );
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

    if (
      videoInputRef.current
    ) {
      videoInputRef.current.value =
        "";
    }

    if (
      thumbnailInputRef.current
    ) {
      thumbnailInputRef.current.value =
        "";
    }

    return () => {
      cleanupPreviewUrls();
    };
  }, [
    open,
    mode,
    reel,
  ]);

  const handleVideoChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    if (!canSubmit) {
      toast.error(
        "You do not have permission to update reels.",
      );
      return;
    }

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "video/",
      )
    ) {
      toast.error(
        "Please select a valid video file.",
      );
      return;
    }

    if (
      file.size >
      50 * 1024 * 1024
    ) {
      toast.error(
        "Video size should be less than 50MB.",
      );
      return;
    }

    if (
      videoObjectUrlRef.current
    ) {
      URL.revokeObjectURL(
        videoObjectUrlRef.current,
      );
    }

    const url =
      URL.createObjectURL(
        file,
      );

    videoObjectUrlRef.current =
      url;

    setVideoFile(file);
    setVideoPreview(url);
  };

  const handleThumbnailChange =
    (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      if (!canSubmit) {
        toast.error(
          "You do not have permission to update reels.",
        );
        return;
      }

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/",
        )
      ) {
        toast.error(
          "Please select a valid image file.",
        );
        return;
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        toast.error(
          "Thumbnail size should be less than 5MB.",
        );
        return;
      }

      if (
        thumbnailObjectUrlRef.current
      ) {
        URL.revokeObjectURL(
          thumbnailObjectUrlRef.current,
        );
      }

      const url =
        URL.createObjectURL(
          file,
        );

      thumbnailObjectUrlRef.current =
        url;

      setThumbnailFile(file);
      setThumbnailPreview(url);
    };

  const resetVideo = () => {
    if (!canSubmit) {
      return;
    }

    if (
      videoObjectUrlRef.current
    ) {
      URL.revokeObjectURL(
        videoObjectUrlRef.current,
      );

      videoObjectUrlRef.current =
        null;
    }

    setVideoFile(null);

    if (
      mode === "edit" &&
      reel
    ) {
      setVideoPreview(
        getVideoUrl(reel),
      );
    } else {
      setVideoPreview("");
    }

    if (
      videoInputRef.current
    ) {
      videoInputRef.current.value =
        "";
    }
  };

  const resetThumbnail =
    () => {
      if (!canSubmit) {
        return;
      }

      if (
        thumbnailObjectUrlRef.current
      ) {
        URL.revokeObjectURL(
          thumbnailObjectUrlRef.current,
        );

        thumbnailObjectUrlRef.current =
          null;
      }

      setThumbnailFile(
        null,
      );

      if (
        mode === "edit" &&
        reel
      ) {
        setThumbnailPreview(
          getThumbnailUrl(
            reel,
          ),
        );
      } else {
        setThumbnailPreview(
          "",
        );
      }

      if (
        thumbnailInputRef.current
      ) {
        thumbnailInputRef.current.value =
          "";
      }
    };

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error(
        `You do not have permission to ${
          mode === "add"
            ? "create"
            : "update"
        } reels.`,
      );

      return;
    }

    const trimmedTitle =
      title.trim();

    const trimmedCreator =
      creatorHandle.trim();

    const trimmedFollowers =
      followersCount.trim();

    const followers =
      Number(
        trimmedFollowers,
      );

    const parsedProductId =
      productId.trim()
        ? Number(productId)
        : null;

    const parsedSortOrder =
      sortOrder.trim()
        ? Number(sortOrder)
        : 1;

    if (!trimmedTitle) {
      toast.error(
        "Please enter reel title.",
      );
      return;
    }

    if (!trimmedCreator) {
      toast.error(
        "Please enter creator handle.",
      );
      return;
    }

    if (!trimmedFollowers) {
      toast.error(
        "Please enter followers count.",
      );
      return;
    }

    if (
      Number.isNaN(followers) ||
      followers < 0
    ) {
      toast.error(
        "Please enter valid followers count.",
      );
      return;
    }

    if (
      productId.trim() &&
      (!parsedProductId ||
        parsedProductId <= 0)
    ) {
      toast.error(
        "Please select a valid product.",
      );
      return;
    }

    if (
      Number.isNaN(
        parsedSortOrder,
      ) ||
      parsedSortOrder < 0
    ) {
      toast.error(
        "Please enter valid sort order.",
      );
      return;
    }

    if (
      mode === "add" &&
      !videoFile &&
      !videoUrl.trim()
    ) {
      toast.error(
        "Please upload a video or enter video URL.",
      );
      return;
    }

    if (
      mode === "add" &&
      !thumbnailFile
    ) {
      toast.error(
        "Please upload thumbnail.",
      );
      return;
    }

    const formData =
      new FormData();

    formData.append(
      "title",
      trimmedTitle,
    );

    formData.append(
      "creator_handle",
      trimmedCreator,
    );

    formData.append(
      "followers_count",
      String(
        followers,
      ),
    );

    if (
      parsedProductId !==
        null &&
      !Number.isNaN(
        parsedProductId,
      )
    ) {
      formData.append(
        "product_id",
        String(
          parsedProductId,
        ),
      );
    }

    formData.append(
      "is_published",
      isPublished
        ? "1"
        : "0",
    );

    formData.append(
      "sort_order",
      String(
        parsedSortOrder,
      ),
    );

    if (
      videoFile instanceof
      File
    ) {
      formData.append(
        "video",
        videoFile,
        videoFile.name,
      );
    }

    if (videoUrl.trim()) {
      formData.append(
        "video_url",
        videoUrl.trim(),
      );
    }

    if (
      thumbnailFile instanceof
      File
    ) {
      formData.append(
        "thumbnail",
        thumbnailFile,
        thumbnailFile.name,
      );
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    if (loading) {
      return;
    }

    cleanupPreviewUrls();
    onClose();
  };

  if (!canSubmit) {
    return null;
  }

  return (
    <GlobalModal
      isOpen={open}
      onClose={handleClose}
      closeOnOverlayClick={
        !loading
      }
      title=""
    >
      <div className="w-full max-w-[650px] overflow-hidden rounded-[20px] border border-[#D8E2F0] bg-white font-poppins shadow-2xl">
        {/* TOP LINE */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#60A5FA] via-[#1E3A8A] to-[#172554]" />

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-[#D8E2F0] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
              <FiFilm
                size={18}
              />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#0F1B3D]">
                {mode ===
                "add"
                  ? "Add Reel"
                  : "Update Reel"}
              </h2>

              <p className="mt-0.5 text-xs text-[#4A5778]">
                {mode ===
                "add"
                  ? "Create a new social reel."
                  : "Update reel content and details."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={loading}
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#4A5778] transition hover:bg-[#EAF1FF] hover:text-[#1E3A8A] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[76vh] overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            {/* TITLE */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#4A5778]">
                Reel Title
                <span className="ml-1 text-[#C23B32]">
                  *
                </span>
              </label>

              <input
                type="text"
                value={title}
                onChange={(
                  e,
                ) =>
                  setTitle(
                    e.target
                      .value,
                  )
                }
                disabled={
                  loading
                }
                placeholder="Enter your reel title"
                className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-white px-4 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10"
              />
            </div>

            {/* CREATOR + FOLLOWERS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#4A5778]">
                  Creator Handle
                  <span className="ml-1 text-[#C23B32]">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={
                    creatorHandle
                  }
                  onChange={(
                    e,
                  ) =>
                    setCreatorHandle(
                      e.target
                        .value,
                    )
                  }
                  disabled={
                    loading
                  }
                  placeholder="Enter creator name"
                  className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-white px-4 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#4A5778]">
                  Followers Count
                </label>

                <div className="relative">
                  <FiUsers
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
                  />

                  <input
                    type="number"
                    min="0"
                    value={
                      followersCount
                    }
                    onChange={(
                      e,
                    ) =>
                      setFollowersCount(
                        e.target
                          .value,
                      )
                    }
                    disabled={
                      loading
                    }
                    placeholder="100"
                    className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-white pl-10 pr-4 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10"
                  />
                </div>
              </div>
            </div>

            {/* SORT ORDER */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#4A5778]">
                Sort Order
              </label>

              <input
                type="number"
                min="0"
                value={
                  sortOrder
                }
                onChange={(
                  e,
                ) =>
                  setSortOrder(
                    e.target
                      .value,
                  )
                }
                disabled={
                  loading
                }
                placeholder="1"
                className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-white px-4 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10"
              />

              <p className="mt-1 text-[10px] text-[#8C97B2]">
                Controls the display order of the reel.
              </p>
            </div>

            {/* PRODUCT */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#4A5778]">
                Product
              </label>

              <select
                value={
                  productId
                }
                onChange={(
                  e,
                ) =>
                  setProductId(
                    e.target
                      .value,
                  )
                }
                disabled={
                  loading ||
                  productsLoading
                }
                className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-white px-4 text-sm text-[#0F1B3D] outline-none transition focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 disabled:cursor-not-allowed disabled:bg-[#F5F8FF]"
              >
                <option value="">
                  {productsLoading
                    ? "Loading products..."
                    : "Select the product for your reel"}
                </option>

                {products.map(
                  (
                    product,
                  ) => (
                    <option
                      key={
                        product.id
                      }
                      value={String(
                        product.id,
                      )}
                    >
                      {product.name ||
                        product.product_code ||
                        product.slug ||
                        `Product ${product.id}`}
                      {product.slug &&
                      product.name
                        ? ` — ${product.slug}`
                        : ""}
                    </option>
                  ),
                )}
              </select>

              <p className="mt-1 text-[10px] text-[#8C97B2]">
                Select a product to link with this reel.
              </p>
            </div>

            {/* PUBLISHED */}
            <div className="flex items-center justify-between rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-[#0F1B3D]">
                  Publish Reel
                </p>

                <p className="mt-0.5 text-[10px] text-[#8C97B2]">
                  Published reels are visible on the website.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  loading
                }
                onClick={() =>
                  setIsPublished(
                    (
                      value,
                    ) =>
                      !value,
                  )
                }
                className={`relative h-6 w-11 rounded-full transition ${
                  isPublished
                    ? "bg-[#1E3A8A]"
                    : "bg-[#D8E2F0]"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                    isPublished
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* VIDEO URL */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#4A5778]">
                Video URL
              </label>

              <div className="relative">
                <FiLink
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
                />

                <input
                  type="url"
                  value={
                    videoUrl
                  }
                  onChange={(
                    e,
                  ) =>
                    setVideoUrl(
                      e.target
                        .value,
                    )
                  }
                  disabled={
                    loading
                  }
                  placeholder="https://www.youtube.com/shorts/..."
                  className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-white pl-10 pr-4 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10"
                />
              </div>
            </div>

            {/* VIDEO UPLOAD */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#4A5778]">
                  Video File
                  {mode ===
                    "add" && (
                    <span className="ml-1 text-[#C23B32]">
                      *
                    </span>
                  )}
                </label>

                <span className="text-[10px] text-[#8C97B2]">
                  Max 50MB
                </span>
              </div>

              <input
                ref={
                  videoInputRef
                }
                type="file"
                accept="video/*"
                onChange={
                  handleVideoChange
                }
                disabled={
                  loading
                }
                className="hidden"
              />

              {!videoPreview ? (
                <button
                  type="button"
                  onClick={() =>
                    videoInputRef.current?.click()
                  }
                  disabled={
                    loading
                  }
                  className="flex w-full items-center justify-center gap-4 rounded-xl border border-dashed border-[#D8E2F0] bg-[#F5F8FF] px-5 py-7 transition hover:border-[#1E3A8A] hover:bg-[#EAF1FF]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                    <FiUpload
                      size={19}
                    />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#0F1B3D]">
                      Upload Reel Video
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#8C97B2]">
                      MP4, MOV, WEBM or other supported video
                    </p>
                  </div>
                </button>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                  <div className="flex gap-3">
                    <div className="h-[90px] w-[70px] shrink-0 overflow-hidden rounded-xl bg-black">
                      <video
                        src={
                          videoPreview
                        }
                        className="h-full w-full object-cover"
                        controls
                        playsInline
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#0F1B3D]">
                        {videoFile?.name ||
                          "Current reel video"}
                      </p>

                      <p className="mt-1 text-[10px] text-[#8C97B2]">
                        {videoFile
                          ? "New video selected"
                          : "Current uploaded video"}
                      </p>

                      <div className="mt-3 flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            videoInputRef.current?.click()
                          }
                          disabled={
                            loading
                          }
                          className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                        >
                          Change Video
                        </button>

                        {videoFile && (
                          <button
                            type="button"
                            onClick={
                              resetVideo
                            }
                            disabled={
                              loading
                            }
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
                <label className="block text-xs font-semibold text-[#4A5778]">
                  Thumbnail
                  {mode ===
                    "add" && (
                    <span className="ml-1 text-[#C23B32]">
                      *
                    </span>
                  )}
                </label>

                <span className="text-[10px] text-[#8C97B2]">
                  Max 5MB
                </span>
              </div>

              <input
                ref={
                  thumbnailInputRef
                }
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={
                  handleThumbnailChange
                }
                disabled={
                  loading
                }
                className="hidden"
              />

              {!thumbnailPreview ? (
                <button
                  type="button"
                  onClick={() =>
                    thumbnailInputRef.current?.click()
                  }
                  disabled={
                    loading
                  }
                  className="flex w-full items-center justify-center gap-4 rounded-xl border border-dashed border-[#D8E2F0] bg-[#F5F8FF] px-5 py-7 transition hover:border-[#1E3A8A] hover:bg-[#EAF1FF]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                    <FiImage
                      size={19}
                    />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#0F1B3D]">
                      Upload Thumbnail
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#8C97B2]">
                      PNG, JPG, JPEG or WEBP
                    </p>
                  </div>
                </button>
              ) : (
                <div className="rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-[76px] w-[58px] shrink-0 overflow-hidden rounded-xl border border-[#D8E2F0] bg-white">
                      <img
                        src={
                          thumbnailPreview
                        }
                        alt={
                          title ||
                          "Reel thumbnail"
                        }
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#0F1B3D]">
                        {thumbnailFile?.name ||
                          "Current thumbnail"}
                      </p>

                      <p className="mt-0.5 text-[10px] text-[#8C97B2]">
                        {thumbnailFile
                          ? "New thumbnail selected"
                          : "Current uploaded thumbnail"}
                      </p>

                      <div className="mt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            thumbnailInputRef.current?.click()
                          }
                          disabled={
                            loading
                          }
                          className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                        >
                          Change Thumbnail
                        </button>

                        {thumbnailFile && (
                          <button
                            type="button"
                            onClick={
                              resetThumbnail
                            }
                            disabled={
                              loading
                            }
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
                <p className="text-xs font-semibold text-[#4A5778]">
                  Live Preview
                </p>

                <span className="text-[10px] text-[#8C97B2]">
                  Reel card
                </span>
              </div>

              <div className="overflow-hidden rounded-[18px] bg-[#0B1228]">
                <div className="relative aspect-[9/12] max-h-[320px] w-full">
                  {videoPreview ? (
                    <video
                      src={
                        videoPreview
                      }
                      poster={
                        thumbnailPreview ||
                        undefined
                      }
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : thumbnailPreview ? (
                    <img
                      src={
                        thumbnailPreview
                      }
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-white">
                      <FiFilm
                        size={32}
                        className="text-[#60A5FA]"
                      />

                      <p className="mt-3 text-xs font-semibold">
                        Reel Preview
                      </p>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                    <p className="text-[10px] font-medium text-white/70">
                      {creatorHandle ||
                        "Creator handle"}
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {title ||
                        "Reel title"}
                    </h3>

                    <div className="mt-2 flex items-center gap-2 text-[10px] text-white/70">
                      <FiUsers
                        size={11}
                      />

                      {Number(
                        followersCount ||
                          0,
                      ).toLocaleString(
                        "en-IN",
                      )}{" "}
                      followers
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-[#D8E2F0] bg-white px-5 py-4">
          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              loading
            }
            className="rounded-xl border border-[#D8E2F0] bg-white px-5 py-2.5 text-sm font-medium text-[#4A5778] transition hover:bg-[#F5F8FF] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              handleSubmit
            }
            disabled={
              loading
            }
            className="flex min-w-[125px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <FiRefreshCw
                  size={14}
                  className="animate-spin"
                />

                {mode ===
                "add"
                  ? "Creating..."
                  : "Updating..."}
              </>
            ) : mode ===
              "add" ? (
              <>
                <FiPlus
                  size={15}
                />
                Create Reel
              </>
            ) : (
              <>
                <FiCheckCircle
                  size={15}
                />
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

const DeleteReelModal: React.FC<
  DeleteReelModalProps
> = ({
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
        if (!loading) {
          onClose();
        }
      }}
      closeOnOverlayClick={
        !loading
      }
      title=""
    >
      <div className="w-full max-w-[430px] overflow-hidden rounded-[20px] border border-[#D8E2F0] bg-white font-poppins shadow-2xl">
        <div className="h-[3px] bg-gradient-to-r from-[#2563EB] to-[#C23B32]" />

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FBEAEA] text-[#C23B32]">
              <FiTrash2
                size={19}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-[#0F1B3D]">
                Delete Reel?
              </h2>

              <p className="mt-1.5 text-xs leading-5 text-[#4A5778]">
                This action will permanently remove the selected reel.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={
                loading
              }
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#4A5778] hover:bg-[#EAF1FF]"
            >
              <FiX size={17} />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] p-3">
            <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-[#0B1228]">
              {reel &&
              getThumbnailUrl(
                reel,
              ) ? (
                <img
                  src={getThumbnailUrl(
                    reel,
                  )}
                  alt={
                    reel.title
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[#60A5FA]">
                  <FiFilm
                    size={18}
                  />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#0F1B3D]">
                {reel?.title ||
                  "Selected Reel"}
              </p>

              <p className="mt-0.5 text-xs text-[#4A5778]">
                {reel?.creator_handle
                  ? `@${reel.creator_handle}`
                  : "Reel"}
              </p>

              {getProductSlug(
                reel,
              ) && (
                <p className="mt-0.5 truncate text-[10px] font-medium text-[#1E3A8A]">
                  {
                    getProductSlug(
                      reel,
                    )
                  }
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#D8E2F0] bg-[#FAFBFF] px-5 py-4">
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              loading
            }
            className="rounded-xl border border-[#D8E2F0] bg-white px-5 py-2.5 text-sm font-medium text-[#4A5778] transition hover:bg-[#F5F8FF] disabled:opacity-50"
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
            className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#C23B32] to-[#A62F27] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.6)] transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <FiRefreshCw
                  size={14}
                  className="animate-spin"
                />
                Deleting...
              </>
            ) : (
              <>
                <FiTrash2
                  size={14}
                />
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

const ReelCard: React.FC<
  ReelCardProps
> = ({
  reel,
  serialNumber,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}) => {
  const thumbnail =
    getThumbnailUrl(reel);

  const video =
    getVideoUrl(reel);

  return (
    <motion.div
      variants={
        itemVariants
      }
      whileHover={{
        y: -3,
      }}
      className="group overflow-hidden rounded-[18px] border border-[#D8E2F0] bg-white font-poppins shadow-sm transition-all duration-300 hover:border-[#1E3A8A]/30 hover:shadow-[0_15px_35px_rgba(30,58,138,0.09)]"
    >
      {/* VIDEO / IMAGE */}
      <div className="relative aspect-[9/11] overflow-hidden bg-[#0B1228]">
        {video ? (
          <video
            src={video}
            poster={
              thumbnail ||
              undefined
            }
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={
              reel.title
            }
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FiFilm
              size={35}
              className="text-[#60A5FA]"
            />
          </div>
        )}

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />

        {/* PUBLISHED */}
        <span
          className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-bold ${
            reel.is_published
              ? "bg-white/95 text-[#1E3A8A]"
              : "bg-black/60 text-white"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              reel.is_published
                ? "bg-[#1E3A8A]"
                : "bg-[#D8E2F0]"
            }`}
          />

          {reel.is_published
            ? "Published"
            : "Draft"}
        </span>

        {/* SERIAL */}
        <span className="absolute left-3 top-3 rounded-lg bg-black/55 px-2 py-1 text-[9px] font-bold text-white">
          #
          {
            serialNumber
          }
        </span>

        {/* BOTTOM CONTENT */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-[10px] font-medium text-white/65">
            {
              reel.creator_handle
            }
          </p>

          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5">
            {reel.title}
          </h3>

          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-white/65">
            <span className="flex items-center gap-1.5">
              <FiUsers
                size={11}
              />

              {Number(
                reel.followers_count ||
                  0,
              ).toLocaleString(
                "en-IN",
              )}
            </span>

            <span>
              {formatDate(
                reel.created_at,
              )}
            </span>
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
              Product
            </p>

            {reel.product &&
            getProductSlug(
              reel,
            ) ? (
              <a
                href={getProductLink(
                  reel,
                )}
                className="mt-1 block truncate text-xs font-semibold text-[#1E3A8A] underline-offset-2 transition hover:text-[#172554] hover:underline"
                title={getProductSlug(
                  reel,
                )}
              >
                {
                  getProductSlug(
                    reel,
                  )
                }
              </a>
            ) : (
              <p className="mt-1 truncate text-xs font-semibold text-[#8C97B2]">
                No product linked
              </p>
            )}
          </div>

          <span className="shrink-0 rounded-lg bg-[#EAF1FF] px-2.5 py-1.5 text-[9px] font-bold text-[#1E3A8A]">
            Reel #
            {
              serialNumber
            }
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#D8E2F0] pt-3">
          <div className="flex items-center gap-2 text-[10px] text-[#8C97B2]">
            {reel.video_url ? (
              <>
                <FiLink
                  size={12}
                />
                External URL
              </>
            ) : (
              <>
                <FiFilm
                  size={12}
                />
                Uploaded Video
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() =>
                  onEdit(
                    reel,
                  )
                }
                title="Edit Reel"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#4A5778] transition hover:border-[#1E3A8A] hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
              >
                <FiEdit2
                  size={14}
                />
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() =>
                  onDelete(
                    reel,
                  )
                }
                title="Delete Reel"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2F0] bg-white text-[#4A5778] transition hover:border-[#C23B32] hover:bg-[#FBEAEA] hover:text-[#C23B32]"
              >
                <FiTrash2
                  size={14}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const ReelsManagement: React.FC =
  () => {
    // =================================================
    // PERMISSIONS
    // =================================================

    const {
      hasPermission,
      isSuperAdmin,
      loading:
        permissionsLoading,
    } = usePermissions();

    const hasAnyPermission =
      (
        permissionKeys: string[],
      ) =>
        permissionKeys.some(
          (key) =>
            hasPermission(
              key,
            ),
        );

    const canViewReels =
      isSuperAdmin ||
      hasAnyPermission(
        VIEW_PERMISSION_KEYS,
      );

    const canCreateReels =
      isSuperAdmin ||
      hasAnyPermission(
        CREATE_PERMISSION_KEYS,
      );

    const canUpdateReels =
      isSuperAdmin ||
      hasAnyPermission(
        UPDATE_PERMISSION_KEYS,
      );

    const canDeleteReels =
      isSuperAdmin ||
      hasAnyPermission(
        DELETE_PERMISSION_KEYS,
      );

    // =================================================
    // STATE
    // =================================================

    const [
      reels,
      setReels,
    ] = useState<Reel[]>(
      [],
    );

    const [
      products,
      setProducts,
    ] = useState<
      ReelProduct[]
    >([]);

    const [
      productsLoading,
      setProductsLoading,
    ] = useState(false);

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
      selectedReel,
      setSelectedReel,
    ] =
      useState<Reel | null>(
        null,
      );

    // =================================================
    // DUPLICATE API PROTECTION
    // =================================================

    const reelsFetchInFlightRef =
      useRef<Promise<void> | null>(
        null,
      );

    const productsFetchInFlightRef =
      useRef<Promise<void> | null>(
        null,
      );

    const hasInitialReelsFetchRef =
      useRef(false);

    const hasInitialProductsFetchRef =
      useRef(false);

    // =================================================
    // FETCH REELS
    // =================================================

    const fetchReels = async (
      force = false,
    ) => {
      if (
        reelsFetchInFlightRef.current
      ) {
        return reelsFetchInFlightRef.current;
      }

      if (
        !force &&
        hasInitialReelsFetchRef.current
      ) {
        return;
      }

      if (!canViewReels) {
        return;
      }

      const requestPromise =
        (async () => {
          try {
            setLoading(
              true,
            );

            const response =
              await reelsApi.getAll();

            if (
              response.data
                ?.data
            ) {
              setReels(
                response.data
                  .data,
              );

              hasInitialReelsFetchRef.current =
                true;
            } else {
              setReels([]);

              toast.error(
                response.data
                  ?.message ||
                  "Unable to fetch reels.",
              );
            }
          } catch (error: any) {
            console.error(
              "Fetch reels error:",
              error,
            );

            toast.error(
              error?.response
                ?.data
                ?.message ||
                "Unable to fetch reels.",
            );
          } finally {
            setLoading(
              false,
            );
          }
        })();

      reelsFetchInFlightRef.current =
        requestPromise;

      try {
        await requestPromise;
      } finally {
        reelsFetchInFlightRef.current =
          null;
      }
    };

    // =================================================
    // FETCH PRODUCTS
    // =================================================

    const fetchProducts =
      async (
        force = false,
      ) => {
        if (
          productsFetchInFlightRef.current
        ) {
          return productsFetchInFlightRef.current;
        }

        if (
          !force &&
          hasInitialProductsFetchRef.current
        ) {
          return;
        }

        if (
          !canCreateReels &&
          !canUpdateReels
        ) {
          return;
        }

        const requestPromise =
          (async () => {
            try {
              setProductsLoading(
                true,
              );

              const response =
                await productApi.getProducts();

              let productData: any[] =
                [];

              if (
                response?.data
                  ?.data
                  ?.data
              ) {
                productData =
                  response.data
                    .data
                    .data;
              } else if (
                response?.data
                  ?.data
              ) {
                productData =
                  response.data
                    .data;
              } else if (
                response?.data
              ) {
                productData =
                  response.data;
              } else if (
                Array.isArray(
                  response,
                )
              ) {
                productData =
                  response;
              }

              const productsArray =
                Array.isArray(
                  productData,
                )
                  ? productData.filter(
                      (
                        item: any,
                      ) =>
                        item &&
                        item.id,
                    )
                  : [];

              const mappedProducts =
                productsArray.map(
                  (
                    product: any,
                  ) => ({
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    product_code:
                      product.product_code,
                  }),
                );

              setProducts(
                mappedProducts,
              );

              hasInitialProductsFetchRef.current =
                true;

              if (
                mappedProducts.length ===
                0
              ) {
                console.warn(
                  "No products found in response",
                );
              }
            } catch (error: any) {
              console.error(
                "Fetch products error:",
                error,
              );

              toast.error(
                error?.response
                  ?.data
                  ?.message ||
                  "Unable to fetch products.",
              );

              setProducts(
                [],
              );
            } finally {
              setProductsLoading(
                false,
              );
            }
          })();

        productsFetchInFlightRef.current =
          requestPromise;

        try {
          await requestPromise;
        } finally {
          productsFetchInFlightRef.current =
            null;
        }
      };

    // =================================================
    // INITIAL FETCH
    // =================================================

    useEffect(() => {
      if (
        permissionsLoading
      ) {
        return;
      }

      if (canViewReels) {
        fetchReels();
      }

      if (
        canCreateReels ||
        canUpdateReels
      ) {
        fetchProducts();
      }
    }, [
      permissionsLoading,
      canViewReels,
      canCreateReels,
      canUpdateReels,
    ]);

    // =================================================
    // SEARCH
    // =================================================

    const filteredReels =
      useMemo(() => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return reels;
        }

        return reels.filter(
          (reel) =>
            reel.title
              ?.toLowerCase()
              .includes(query) ||
            reel.creator_handle
              ?.toLowerCase()
              .includes(query) ||
            String(
              reel.id,
            ).includes(
              query,
            ) ||
            String(
              reel.product?.id ||
                "",
            ).includes(
              query,
            ) ||
            String(
              (
                reel.product as any
              )?.name ||
                "",
            )
              .toLowerCase()
              .includes(query) ||
            getProductSlug(
              reel,
            )
              .toLowerCase()
              .includes(query),
        );
      }, [
        reels,
        search,
      ]);

    // =================================================
    // STATS
    // =================================================

    const totalReels =
      reels.length;

    const publishedReels =
      reels.filter(
        (reel) =>
          reel.is_published,
      ).length;

    const draftReels =
      reels.filter(
        (reel) =>
          !reel.is_published,
      ).length;

    // =================================================
    // HANDLERS
    // =================================================

    const openAdd = () => {
      if (!canCreateReels) {
        toast.error(
          "You do not have permission to create reels.",
        );
        return;
      }

      setSelectedReel(
        null,
      );

      setModalMode("add");

      setAddEditOpen(
        true,
      );
    };

    const openEdit = (
      reel: Reel,
    ) => {
      if (!canUpdateReels) {
        toast.error(
          "You do not have permission to update reels.",
        );
        return;
      }

      setSelectedReel(
        reel,
      );

      setModalMode("edit");

      setAddEditOpen(
        true,
      );

      if (
        !hasInitialProductsFetchRef.current
      ) {
        fetchProducts();
      }
    };

    const openDelete = (
      reel: Reel,
    ) => {
      if (!canDeleteReels) {
        toast.error(
          "You do not have permission to delete reels.",
        );
        return;
      }

      setSelectedReel(
        reel,
      );

      setDeleteOpen(
        true,
      );
    };

    const handleRefresh =
      async () => {
        if (!canViewReels) {
          toast.error(
            "You do not have permission to view reels.",
          );
          return;
        }

        if (loading) {
          return;
        }

        await fetchReels(
          true,
        );

        toast.success(
          "Reels refreshed.",
        );
      };

    // =================================================
    // SAVE
    // =================================================

    const handleSave =
      async (
        payload: FormData,
      ) => {
        const allowed =
          modalMode ===
          "add"
            ? canCreateReels
            : canUpdateReels;

        if (!allowed) {
          toast.error(
            `You do not have permission to ${
              modalMode ===
              "add"
                ? "create"
                : "update"
            } reels.`,
          );

          return;
        }

        if (
          saveLoading
        ) {
          return;
        }

        try {
          setSaveLoading(
            true,
          );

          let response;

          if (
            modalMode ===
              "edit" &&
            selectedReel
          ) {
            response =
              await reelsApi.update(
                selectedReel.id,
                payload,
              );
          } else {
            response =
              await reelsApi.create(
                payload,
              );
          }

          if (
            response.data
              ?.success !==
            false
          ) {
            toast.success(
              response.data
                ?.message ||
                (modalMode ===
                "edit"
                  ? "Reel updated successfully."
                  : "Reel created successfully."),
            );

            setAddEditOpen(
              false,
            );

            setSelectedReel(
              null,
            );

            await fetchReels(
              true,
            );
          } else {
            toast.error(
              response.data
                ?.message ||
                "Unable to save reel.",
            );
          }
        } catch (error: any) {
          console.error(
            "Save reel error:",
            error,
          );

          toast.error(
            error?.response
              ?.data
              ?.message ||
              "Something went wrong while saving reel.",
          );
        } finally {
          setSaveLoading(
            false,
          );
        }
      };

    // =================================================
    // DELETE
    // =================================================

    const handleDelete =
      async () => {
        if (!canDeleteReels) {
          toast.error(
            "You do not have permission to delete reels.",
          );
          return;
        }

        if (
          deleteLoading ||
          !selectedReel
        ) {
          return;
        }

        try {
          setDeleteLoading(
            true,
          );

          const response =
            await reelsApi.delete(
              selectedReel.id,
            );

          if (
            response.data
              ?.success !==
            false
          ) {
            toast.success(
              response.data
                ?.message ||
                "Reel deleted successfully.",
            );

            setDeleteOpen(
              false,
            );

            setSelectedReel(
              null,
            );

            await fetchReels(
              true,
            );
          } else {
            toast.error(
              response.data
                ?.message ||
                "Unable to delete reel.",
            );
          }
        } catch (error: any) {
          console.error(
            "Delete reel error:",
            error,
          );

          toast.error(
            error?.response
              ?.data
              ?.message ||
              "Something went wrong while deleting reel.",
          );
        } finally {
          setDeleteLoading(
            false,
          );
        }
      };

    // =================================================
    // PERMISSION LOADING
    // =================================================

    if (
      permissionsLoading
    ) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-6 font-poppins">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
              <FiRefreshCw
                size={27}
                className="animate-spin"
              />
            </div>

            <p className="mt-4 text-sm font-bold text-[#0F1B3D]">
              Checking permissions...
            </p>

            <p className="mt-1 text-xs text-[#8C97B2]">
              Please wait while we verify your access.
            </p>
          </div>
        </div>
      );
    }

 
    if (
      loading &&
      reels.length ===
        0
    ) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] font-poppins">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#D8E2F0] border-t-[#1E3A8A]" />

            <p className="mt-3 text-sm text-[#4A5778]">
              Loading reels...
            </p>
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
        variants={
          containerVariants
        }
        className="min-h-screen bg-[#F5F8FF] px-4 py-5 font-poppins sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-[1500px]">
          {/* HEADER */}
          <motion.div
            variants={
              itemVariants
            }
            className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"
          >
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1E3A8A]">
                  Content Management
                </span>
              </div>

              <h1 className="text-[29px] font-semibold tracking-tight text-[#0F1B3D] sm:text-[32px]">
                Reels
              </h1>

              <p className="mt-1 text-sm text-[#4A5778]">
                Manage social reels, creators, videos and thumbnails.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={
                  handleRefresh
                }
                disabled={
                  loading
                }
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8E2F0] bg-white px-4 text-sm font-medium text-[#4A5778] shadow-sm transition hover:bg-[#EAF1FF] hover:text-[#1E3A8A] disabled:opacity-50"
              >
                <FiRefreshCw
                  size={15}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                <span className="hidden sm:inline">
                  Refresh
                </span>
              </button>

              {canCreateReels && (
                <button
                  type="button"
                  onClick={
                    openAdd
                  }
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(30,58,138,0.7)]"
                >
                  <FiPlus
                    size={16}
                  />
                  Add Reel
                </button>
              )}
            </div>
          </motion.div>

          {/* STATS */}
          <motion.div
            variants={
              containerVariants
            }
            className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {/* TOTAL */}
            <motion.div
              variants={
                itemVariants
              }
              className="relative overflow-hidden rounded-2xl border border-[#D8E2F0] bg-white p-5 shadow-[0_8px_24px_rgba(30,58,138,0.05)]"
            >
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#60A5FA] via-[#1E3A8A] to-[#172554]" />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                    Total Reels
                  </p>

                  <p className="mt-2 text-[26px] font-bold tracking-tight text-[#0F1B3D]">
                    {
                      totalReels
                    }
                  </p>

                  <p className="mt-1 text-[11px] text-[#4A5778]">
                    All reels in library
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiFilm
                    size={21}
                  />
                </div>
              </div>
            </motion.div>

            {/* PUBLISHED */}
            <motion.div
              variants={
                itemVariants
              }
              className="relative overflow-hidden rounded-2xl border border-[#D8E2F0] bg-white p-5 shadow-[0_8px_24px_rgba(30,58,138,0.05)]"
            >
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#93C5FD] to-[#1E3A8A]" />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                    Published
                  </p>

                  <p className="mt-2 text-[26px] font-bold tracking-tight text-[#0F1B3D]">
                    {
                      publishedReels
                    }
                  </p>

                  <p className="mt-1 text-[11px] text-[#4A5778]">
                    Visible on website
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#DBEAFE] text-[#1E40AF]">
                  <FiCheckCircle
                    size={21}
                  />
                </div>
              </div>
            </motion.div>

            {/* DRAFTS */}
            <motion.div
              variants={
                itemVariants
              }
              className="relative overflow-hidden rounded-2xl border border-[#D8E2F0] bg-white p-5 shadow-[0_8px_24px_rgba(30,58,138,0.05)]"
            >
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#94A3B8] to-[#475569]" />

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8C97B2]">
                    Drafts
                  </p>

                  <p className="mt-2 text-[26px] font-bold tracking-tight text-[#0F1B3D]">
                    {
                      draftReels
                    }
                  </p>

                  <p className="mt-1 text-[11px] text-[#4A5778]">
                    Not yet published
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#F1F5F9] text-[#475569]">
                  <FiFilm
                    size={21}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* MAIN CARD */}
          <motion.div
            variants={
              itemVariants
            }
            className="overflow-hidden rounded-[20px] border border-[#D8E2F0] bg-white shadow-[0_8px_30px_rgba(30,58,138,0.06)]"
          >
            <div className="h-[3px] w-full bg-gradient-to-r from-[#93C5FD] via-[#1E3A8A] to-[#172554]" />

            {/* TOOLBAR */}
            <div className="flex flex-col gap-4 border-b border-[#D8E2F0] p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#0F1B3D]">
                  Reel Directory
                </h2>

                <p className="mt-1 text-xs text-[#4A5778]">
                  {
                    filteredReels.length
                  }{" "}
                  {filteredReels.length ===
                  1
                    ? "reel"
                    : "reels"}{" "}
                  found
                </p>
              </div>

              <div className="relative w-full md:max-w-sm">
                <FiSearch
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target
                        .value,
                    )
                  }
                  placeholder="Search reels, creator or ID..."
                  className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-10 pr-10 text-sm text-[#0F1B3D] outline-none transition placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch(
                        "",
                      )
                    }
                    className="absolute right-3 top-1/2 flex -translate-y-1/2 text-[#8C97B2] hover:text-[#1E3A8A]"
                  >
                    <FiX
                      size={16}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* CONTENT */}
            {filteredReels.length ===
            0 ? (
              <div className="px-5 py-20 text-center sm:px-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiFilm
                    size={27}
                  />
                </div>

                <h3 className="mt-5 text-base font-semibold text-[#0F1B3D]">
                  {search
                    ? "No reels found"
                    : "No reels available"}
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#4A5778]">
                  {search
                    ? "Try searching with another title, creator or reel ID."
                    : "Add your first reel to start managing social content."}
                </p>

                {!search &&
                  canCreateReels && (
                    <button
                      type="button"
                      onClick={
                        openAdd
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.5)] transition hover:-translate-y-0.5"
                    >
                      <FiPlus
                        size={16}
                      />
                      Add Reel
                    </button>
                  )}
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                <motion.div
                  variants={
                    containerVariants
                  }
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {filteredReels.map(
                    (
                      reel,
                      index,
                    ) => (
                      <ReelCard
                        key={
                          reel.id
                        }
                        reel={
                          reel
                        }
                        serialNumber={
                          index +
                          1
                        }
                        canEdit={
                          canUpdateReels
                        }
                        canDelete={
                          canDeleteReels
                        }
                        onEdit={
                          openEdit
                        }
                        onDelete={
                          openDelete
                        }
                      />
                    ),
                  )}
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ADD / EDIT MODAL */}
        <ReelFormModal
          open={
            addEditOpen
          }
          loading={
            saveLoading
          }
          mode={
            modalMode
          }
          reel={
            selectedReel
          }
          products={
            products
          }
          productsLoading={
            productsLoading
          }
          canSubmit={
            modalMode ===
            "add"
              ? canCreateReels
              : canUpdateReels
          }
          onClose={() => {
            if (
              !saveLoading
            ) {
              setAddEditOpen(
                false,
              );

              setSelectedReel(
                null,
              );
            }
          }}
          onSubmit={
            handleSave
          }
        />

        {/* DELETE MODAL */}
        <DeleteReelModal
          open={
            deleteOpen
          }
          loading={
            deleteLoading
          }
          reel={
            selectedReel
          }
          onClose={() => {
            if (
              !deleteLoading
            ) {
              setDeleteOpen(
                false,
              );

              setSelectedReel(
                null,
              );
            }
          }}
          onConfirm={
            handleDelete
          }
        />
      </motion.div>
    );
  };

export default ReelsManagement;