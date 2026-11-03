
"use client";

import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit2,
  FiFilm,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUpload,
  FiUsers,
  FiX,
  FiChevronDown,
  FiCheck,
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
  "https://www.markupdesigns.net/indikonnect/storage/logos/mVmFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

// =====================================================
// PERMISSIONS
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
  "reels.edit",
  "reel.edit",
  "Reels.edit",
  "Reel.edit",
];

const DELETE_PERMISSION_KEYS = [
  "reels.delete",
  "reel.delete",
  "Reels.delete",
  "Reel.delete",
];

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
      type: "spring" as const,
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

// =====================================================
// HELPERS
// =====================================================
const getVideoUrl = (reel: Reel | null) =>
  reel?.video_full_path ||
  reel?.video_full_url ||
  reel?.video_url ||
  reel?.video_path ||
  "";

const getThumbnailUrl = (reel: Reel | null) =>
  reel?.thumbnail_url || reel?.thumbnail || "";

const getReelProduct = (reel: Reel | null) =>
  (reel?.product || null) as ReelProduct | null;

const getProductSlug = (reel: Reel | null) =>
  getReelProduct(reel)?.slug || "";

const getProductLink = (reel: Reel | null) => {
  const product = getReelProduct(reel);

  if (!product) return "";

  return (
    product.product_link ||
    (product.slug ? `/products/${product.slug}` : "")
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

const inputClass =
  "h-11 w-full rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "mb-1.5 block text-xs font-semibold text-[#6B7280]";

// =====================================================
// CUSTOM SEARCHABLE DROPDOWN
// =====================================================
interface SearchableProductSelectProps {
  products: ReelProduct[];
  loading: boolean;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SearchableProductSelect: React.FC<SearchableProductSelectProps> = ({
  products,
  loading,
  value,
  onChange,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedProduct = products.find(
    (product) => String(product.id) === value
  );

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();

    return products.filter(
      (product) =>
        product.name?.toLowerCase().includes(query) ||
        product.slug?.toLowerCase().includes(query) ||
        product.product_code?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  return (
    <div ref={wrapperRef} className="relative">
      <div
        onClick={() => !disabled && !loading && setIsOpen((prev) => !prev)}
        className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm outline-none transition ${
          isOpen
            ? "border-[#2D6FE8] ring-2 ring-[#2D6FE8]/10"
            : "hover:border-[#2D6FE8]/50"
        } ${
          disabled || loading
            ? "cursor-not-allowed opacity-60"
            : ""
        }`}
      >
        <span
          className={`truncate ${
            selectedProduct ? "text-[#111827]" : "text-[#6B7280]"
          }`}
        >
          {loading
            ? "Loading products..."
            : selectedProduct
              ? selectedProduct.name ||
                selectedProduct.slug ||
                `Product ${selectedProduct.id}`
              : "Select the product for your reel"}
        </span>

        <FiChevronDown
          className={`shrink-0 text-[#6B7280] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-[#DCE6F2] bg-white shadow-lg">
          <div className="border-b border-[#DCE6F2] p-2">
            <div className="relative">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                size={14}
              />

              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search product..."
                className="h-9 w-full rounded-lg bg-[#F4F8FD] pl-9 pr-3 text-xs text-[#111827] outline-none placeholder:text-[#6B7280] focus:ring-1 focus:ring-[#2D6FE8]/30"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs text-[#6B7280]">
                No products found
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    onChange(String(product.id));
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-xs transition hover:bg-[#EAF3FF] ${
                    value === String(product.id)
                      ? "bg-[#EAF3FF] font-semibold text-[#2D6FE8]"
                      : "text-[#111827]"
                  }`}
                >
                  <span className="truncate">
                    {product.name ||
                      product.slug ||
                      `Product ${product.id}`}
                  </span>

                  {value === String(product.id) && (
                    <FiCheck className="ml-2 shrink-0 text-[#2D6FE8]" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
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
  canSubmit,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [creatorHandle, setCreatorHandle] = useState("");
  const [followersCount, setFollowersCount] = useState("");
  const [productId, setProductId] = useState("");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const videoObjectUrlRef = useRef<string | null>(null);

  const cleanupPreviewUrls = () => {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
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
      setProductId(
        reel.product?.id ? String(reel.product.id) : ""
      );

      setVideoFile(null);
      setVideoPreview(getVideoUrl(reel));
    } else {
      setTitle("");
      setCreatorHandle("");
      setFollowersCount("");
      setProductId("");

      setVideoFile(null);
      setVideoPreview("");
    }

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }

    return () => cleanupPreviewUrls();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, reel]);

  // =====================================================
  // VIDEO FILE SELECTION
  // =====================================================
  const processVideoFile = (file: File) => {
    if (!canSubmit) {
      toast.error("You do not have permission to update reels.");
      return;
    }

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

  const handleVideoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      processVideoFile(file);
    }
  };

  // =====================================================
  // DRAG & DROP
  // =====================================================
  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!loading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    if (loading) return;

    const file = event.dataTransfer.files?.[0];

    if (file) {
      processVideoFile(file);
    }
  };

  // =====================================================
  // RESET VIDEO
  // =====================================================
  const resetVideo = () => {
    if (!canSubmit) return;

    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
    }

    videoObjectUrlRef.current = null;

    setVideoFile(null);

    setVideoPreview(
      mode === "edit" && reel ? getVideoUrl(reel) : ""
    );

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  // =====================================================
  // FORM SUBMIT
  // =====================================================
  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error(
        `You do not have permission to ${
          mode === "add" ? "create" : "update"
        } reels.`
      );

      return;
    }

    const trimmedTitle = title.trim();
    const trimmedCreator = creatorHandle.trim();
    const trimmedFollowers = followersCount.trim();

    const followers = Number(trimmedFollowers);

    const parsedProductId = productId.trim()
      ? Number(productId)
      : null;

    if (!trimmedTitle) {
      return void toast.error("Please enter reel title.");
    }

    if (!trimmedCreator) {
      return void toast.error("Please enter creator handle.");
    }

    if (!trimmedFollowers) {
      return void toast.error("Please enter followers count.");
    }

    if (!Number.isFinite(followers) || followers < 0) {
      return void toast.error(
        "Please enter valid followers count."
      );
    }

    if (
      productId.trim() &&
      (!parsedProductId || parsedProductId <= 0)
    ) {
      return void toast.error("Please select a valid product.");
    }

    if (mode === "add" && !videoFile) {
      return void toast.error("Please upload a video.");
    }

    const formData = new FormData();

    formData.append("title", trimmedTitle);
    formData.append("creator_handle", trimmedCreator);
    formData.append("followers_count", String(followers));

    if (
      parsedProductId !== null &&
      !Number.isNaN(parsedProductId)
    ) {
      formData.append(
        "product_id",
        String(parsedProductId)
      );
    }

    if (videoFile instanceof File) {
      formData.append(
        "video",
        videoFile,
        videoFile.name
      );
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
    <GlobalModal
      isOpen={open}
      onClose={handleClose}
      closeOnOverlayClick={!loading}
      title=""
    >
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
                {mode === "add"
                  ? "Create a new social reel."
                  : "Update reel details."}
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
              <label className={labelClass}>
                Reel Title{" "}
                <span className="ml-1 text-[#C23B32]">*</span>
              </label>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                disabled={loading}
                placeholder="Enter your reel title"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Creator Handle{" "}
                  <span className="ml-1 text-[#C23B32]">*</span>
                </label>

                <input
                  value={creatorHandle}
                  onChange={(event) =>
                    setCreatorHandle(event.target.value)
                  }
                  disabled={loading}
                  placeholder="Enter creator name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Views Count
                </label>

                <div className="relative">
                  <FiUsers
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                  />

                  <input
                    type="number"
                    min="0"
                    value={followersCount}
                    onChange={(event) =>
                      setFollowersCount(event.target.value)
                    }
                    disabled={loading}
                    placeholder="100"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Product
              </label>

              <SearchableProductSelect
                products={products}
                loading={productsLoading}
                value={productId}
                onChange={setProductId}
                disabled={loading}
              />

              <p className="mt-1 text-[10px] text-[#6B7280]">
                Select a product to link with this reel.
              </p>
            </div>

            {/* VIDEO UPLOAD SECTION */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#6B7280]">
                  Video File{" "}
                  {mode === "add" && (
                    <span className="ml-1 text-[#C23B32]">*</span>
                  )}
                </label>

                <span className="text-[10px] text-[#6B7280]">
                  Max 50MB
                </span>
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
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() =>
                    !loading && videoInputRef.current?.click()
                  }
                  className={`flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-5 py-8 transition ${
                    isDragging
                      ? "border-[#2D6FE8] bg-[#EAF3FF]"
                      : "border-[#DCE6F2] bg-[#F4F8FD] hover:border-[#2D6FE8] hover:bg-[#EAF3FF]"
                  } ${
                    loading
                      ? "cursor-not-allowed opacity-60"
                      : ""
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#2D6FE8] shadow-sm">
                    <FiUpload size={22} />
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#111827]">
                      Drag & drop video here, or{" "}
                      <span className="text-[#2D6FE8]">
                        browse
                      </span>
                    </p>

                    <p className="mt-1 text-[10px] text-[#6B7280]">
                      MP4, MOV, WEBM (Max 50MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
                  <div className="flex gap-3">
                    <div className="h-[90px] w-[70px] shrink-0 overflow-hidden rounded-xl bg-black">
                      <video
                        src={videoPreview}
                        className="h-full w-full object-cover"
                        controls
                        playsInline
                        muted
                        preload="metadata"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#111827]">
                        {videoFile?.name ||
                          "Current uploaded video"}
                      </p>

                      <p className="mt-1 text-[10px] text-[#6B7280]">
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
                          disabled={loading}
                          className="text-xs font-semibold text-[#2D6FE8] hover:underline"
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
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#DCE6F2] bg-white px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#6B7280] transition hover:bg-[#F4F8FD] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex min-w-[125px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <FiRefreshCw
                  size={14}
                  className="animate-spin"
                />
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
}) => (
  <GlobalModal
    isOpen={open}
    onClose={() => {
      if (!loading) onClose();
    }}
    closeOnOverlayClick={!loading}
    title=""
  >
    <div className="w-full max-w-[430px] overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white font-poppins shadow-2xl">
      <div className="h-[3px] bg-gradient-to-r from-[#FACC15] to-[#C23B32]" />

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#C23B32]">
            <FiTrash2 size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-[#111827]">
              Delete Reel?
            </h2>

            <p className="mt-1.5 text-xs leading-5 text-[#6B7280]">
              This action will permanently remove the selected reel.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#EAF3FF]"
          >
            <FiX size={17} />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
          <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-[#0B1228]">
            {reel && getThumbnailUrl(reel) ? (
              <img
                src={getThumbnailUrl(reel)}
                alt={reel.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#FACC15]">
                <FiFilm size={18} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">
              {reel?.title || "Selected Reel"}
            </p>

            <p className="mt-0.5 text-xs text-[#6B7280]">
              {reel?.creator_handle
                ? `@${reel.creator_handle}`
                : "Reel"}
            </p>

            {getProductSlug(reel) && (
              <p className="mt-0.5 truncate text-[10px] font-medium text-[#2D6FE8]">
                {getProductSlug(reel)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#6B7280] transition hover:bg-[#F4F8FD] disabled:opacity-50"
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
              <FiRefreshCw
                size={14}
                className="animate-spin"
              />
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

const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  serialNumber,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}) => {
  const video = getVideoUrl(reel);
  const thumbnail = getThumbnailUrl(reel);

  const product = getReelProduct(reel);
  const productSlug = getProductSlug(reel);
  const productLink = getProductLink(reel);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white font-poppins shadow-sm transition-all duration-300 hover:border-[#2D6FE8]/30 hover:shadow-[0_15px_35px_rgba(45,111,232,0.09)]"
    >
      {/* VIDEO SECTION */}
      <div className="relative aspect-[9/11] w-full overflow-hidden bg-[#0B1228]">
        {video ? (
          <video
            key={video}
            src={video}
            poster={thumbnail || undefined}
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="auto"
            className="h-full w-full bg-black object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FiFilm
              size={35}
              className="text-[#FACC15]"
            />
          </div>
        )}

        {/* VIEWS BADGE - TOP RIGHT */}
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-sm">
          <FiUsers size={11} className="shrink-0 text-white" />
          <span className="text-[10px] font-semibold text-white">
            {Number(reel.followers_count || 0).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* ALL DETAILS BELOW VIDEO */}
      <div className="flex flex-1 flex-col p-4">
        {/* TITLE */}
        <div className="min-w-0">
          <h3
            title={reel.title || ""}
            className="line-clamp-2 text-sm font-semibold leading-5 text-[#111827]"
          >
            {reel.title || "Untitled Reel"}
          </h3>
        </div>

        {/* CREATOR */}
        <div className="mt-2 flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
            <FiUsers size={13} />
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Creator
            </p>

            <p className="truncate text-xs font-semibold text-[#111827]">
              {reel.creator_handle
                ? `@${reel.creator_handle}`
                : "Unknown Creator"}
            </p>
          </div>
        </div>

        {/* PRODUCT SECTION */}
        <div className="mt-3 rounded-xl border border-[#DCE6F2] bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
              Linked Product
            </p>

            {product && (
              <span className="rounded-md bg-[#EAF3FF] px-2 py-0.5 text-[9px] font-semibold text-[#2D6FE8]">
                Linked
              </span>
            )}
          </div>

          {product ? (
            <div className="min-w-0">
              {productLink ? (
                <a
                  href={productLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={product.name || productSlug}
                  className="block truncate text-xs font-semibold text-[#2D6FE8] underline-offset-2 transition hover:text-[#1D4ED8] hover:underline"
                >
                  {product.name || productSlug || `Product ${product.id}`}
                </a>
              ) : (
                <p className="truncate text-xs font-semibold text-[#111827]">
                  {product.name || productSlug || `Product ${product.id}`}
                </p>
              )}

              {productSlug && product.name && (
                <p className="mt-1 truncate text-[10px] text-[#6B7280]">
                  {productSlug}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs font-medium text-[#9CA3AF]">
              No product linked
            </p>
          )}
        </div>

        {/* ACTION BUTTONS */}
        {(canEdit || canDelete) && (
          <div className="mt-auto flex items-center justify-end gap-2 border-t border-[#DCE6F2] pt-3 mt-4">
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(reel)}
                title="Edit / Update Reel"
                aria-label={`Edit reel ${reel.title}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#2D6FE8] transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF] hover:text-[#1D4ED8]"
              >
                <FiEdit2 size={14} />
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(reel)}
                title="Delete Reel"
                aria-label={`Delete reel ${reel.title}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#6B7280] transition hover:border-[#C23B32] hover:bg-[#FEF2F2] hover:text-[#C23B32]"
              >
                <FiTrash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================
const ReelsManagement: React.FC = () => {
  const {
    hasPermission,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const hasAnyPermission = (permissionKeys: string[]) =>
    permissionKeys.some((key) => hasPermission(key));

  const canViewReels =
    isSuperAdmin || hasAnyPermission(VIEW_PERMISSION_KEYS);

  const canCreateReels =
    isSuperAdmin || hasAnyPermission(CREATE_PERMISSION_KEYS);

  const canUpdateReels =
    isSuperAdmin || hasAnyPermission(UPDATE_PERMISSION_KEYS);

  const canDeleteReels =
    isSuperAdmin || hasAnyPermission(DELETE_PERMISSION_KEYS);

  const [logoUrl, setLogoUrl] = useState<string | null>(
    DEFAULT_LOGO_URL
  );

  const [logoLoading, setLogoLoading] = useState(true);

  const [reels, setReels] = useState<Reel[]>([]);
  const [products, setProducts] = useState<ReelProduct[]>([]);

  const [productsLoading, setProductsLoading] = useState(false);

  const [initialReelsLoading, setInitialReelsLoading] =
    useState(true);

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [addEditOpen, setAddEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [modalMode, setModalMode] = useState<"add" | "edit">(
    "add"
  );

  const [selectedReel, setSelectedReel] =
    useState<Reel | null>(null);

  const reelsFetchInFlightRef =
    useRef<Promise<void> | null>(null);

  const productsFetchInFlightRef =
    useRef<Promise<void> | null>(null);

  const hasInitialReelsFetchRef = useRef(false);
  const hasInitialProductsFetchRef = useRef(false);

  // =====================================================
  // FETCH LOGO
  // =====================================================
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
            typeof value === "string" &&
            /^https?:\/\//i.test(value.trim())
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

  // =====================================================
  // FETCH REELS
  // =====================================================
  const fetchReels = async (
    force = false,
    isInitialLoad = false
  ): Promise<void> => {
    if (reelsFetchInFlightRef.current) {
      return reelsFetchInFlightRef.current;
    }

    if (!force && hasInitialReelsFetchRef.current) {
      return;
    }

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

          toast.error(
            response.data?.message || "Unable to fetch reels."
          );
        }
      } catch (error: any) {
        console.error("Fetch reels error:", error);

        toast.error(
          error?.response?.data?.message ||
            "Unable to fetch reels."
        );
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

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================
  const fetchProducts = async (
    force = false
  ): Promise<void> => {
    if (productsFetchInFlightRef.current) {
      return productsFetchInFlightRef.current;
    }

    if (!force && hasInitialProductsFetchRef.current) {
      return;
    }

    if (!canCreateReels && !canUpdateReels) {
      return;
    }

    const requestPromise = (async () => {
      try {
        setProductsLoading(true);

        const response = await productApi.getProducts();

        let productData: any[] = [];

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
          ? productData.filter((item: any) => item?.id)
          : [];

        const mappedProducts: ReelProduct[] =
          productsArray.map((product: any) => ({
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

        toast.error(
          error?.response?.data?.message ||
            "Unable to fetch products."
        );

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

  // =====================================================
  // INITIAL API CALLS
  // =====================================================
  useEffect(() => {
    if (permissionsLoading) return;

    if (
      canViewReels &&
      !hasInitialReelsFetchRef.current
    ) {
      void fetchReels(false, true);
    } else if (!canViewReels) {
      setLoading(false);
      setInitialReelsLoading(false);
    }

    if (canCreateReels || canUpdateReels) {
      void fetchProducts();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    permissionsLoading,
    canViewReels,
    canCreateReels,
    canUpdateReels,
  ]);

  // =====================================================
  // PAGE LOADING
  // =====================================================
  const pageLoading =
    permissionsLoading ||
    logoLoading ||
    initialReelsLoading;

  // =====================================================
  // SEARCH FILTER
  // =====================================================
  const filteredReels = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return reels;

    return reels.filter(
      (reel) =>
        reel.title?.toLowerCase().includes(query) ||
        reel.creator_handle?.toLowerCase().includes(query) ||
        String(reel.id).includes(query) ||
        String(reel.product?.id || "").includes(query) ||
        String(reel.product?.name || "")
          .toLowerCase()
          .includes(query) ||
        getProductSlug(reel)
          .toLowerCase()
          .includes(query)
    );
  }, [reels, search]);

  // =====================================================
  // OPEN ADD
  // =====================================================
  const openAdd = () => {
    if (!canCreateReels) {
      return void toast.error(
        "You do not have permission to create reels."
      );
    }

    setSelectedReel(null);
    setModalMode("add");
    setAddEditOpen(true);
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================
  const openEdit = (reel: Reel) => {
    if (!canUpdateReels) {
      return void toast.error(
        "You do not have permission to update reels."
      );
    }

    setSelectedReel(reel);
    setModalMode("edit");
    setAddEditOpen(true);

    if (!hasInitialProductsFetchRef.current) {
      void fetchProducts();
    }
  };

  // =====================================================
  // OPEN DELETE
  // =====================================================
  const openDelete = (reel: Reel) => {
    if (!canDeleteReels) {
      return void toast.error(
        "You do not have permission to delete reels."
      );
    }

    setSelectedReel(reel);
    setDeleteOpen(true);
  };

  // =====================================================
  // REFRESH
  // =====================================================
  const handleRefresh = async () => {
    if (!canViewReels) {
      return void toast.error(
        "You do not have permission to view reels."
      );
    }

    if (loading) return;

    await fetchReels(true);

    toast.success("Reels refreshed.");
  };

  // =====================================================
  // SAVE REEL
  // =====================================================
  const handleSave = async (payload: FormData) => {
    const allowed =
      modalMode === "add"
        ? canCreateReels
        : canUpdateReels;

    if (!allowed) {
      return void toast.error(
        `You do not have permission to ${
          modalMode === "add" ? "create" : "update"
        } reels.`
      );
    }

    if (saveLoading) return;

    try {
      setSaveLoading(true);

      const response =
        modalMode === "edit" && selectedReel
          ? await reelsApi.update(
              selectedReel.id,
              payload
            )
          : await reelsApi.create(payload);

      if (response.data?.success !== false) {
        toast.success(
          response.data?.message ||
            (modalMode === "edit"
              ? "Reel updated successfully."
              : "Reel created successfully.")
        );

        setAddEditOpen(false);
        setSelectedReel(null);

        await fetchReels(true);
      } else {
        toast.error(
          response.data?.message ||
            "Unable to save reel."
        );
      }
    } catch (error: any) {
      console.error("Save reel error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Something went wrong while saving reel."
      );
    } finally {
      setSaveLoading(false);
    }
  };

  // =====================================================
  // DELETE REEL
  // =====================================================
  const handleDelete = async () => {
    if (!canDeleteReels) {
      return void toast.error(
        "You do not have permission to delete reels."
      );
    }

    if (deleteLoading || !selectedReel) return;

    try {
      setDeleteLoading(true);

      const response = await reelsApi.delete(
        selectedReel.id
      );

      if (response.data?.success !== false) {
        toast.success(
          response.data?.message ||
            "Reel deleted successfully."
        );

        setDeleteOpen(false);
        setSelectedReel(null);

        await fetchReels(true);
      } else {
        toast.error(
          response.data?.message ||
            "Unable to delete reel."
        );
      }
    } catch (error: any) {
      console.error("Delete reel error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Something went wrong while deleting reel."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // =====================================================
  // PAGE LOADING STATE
  // =====================================================
  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  // =====================================================
  // ACCESS DENIED
  // =====================================================
  if (!canViewReels) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
        <div className="rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-sm">
          <FiAlertCircle
            size={30}
            className="mx-auto text-[#C23B32]"
          />

          <h2 className="mt-3 text-base font-semibold text-[#111827]">
            Access denied
          </h2>

          <p className="mt-1 text-sm text-[#6B7280]">
            You do not have permission to view reels.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-[#F4F8FD] px-4 py-5 font-poppins sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1500px]">
        {/* PAGE HEADER */}
        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center"
        >
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2D6FE8]">
                Content Management
              </span>
            </div>

            <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
              Reels
            </h1>

            <p className="mt-0.5 text-sm text-[#111827]">
              Manage social reels, creators, videos and thumbnails.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm font-medium text-[#6B7280] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
            >
              <FiRefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            {canCreateReels && (
              <button
                type="button"
                onClick={openAdd}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.7)]"
              >
                <FiPlus size={16} />
                Add Reel
              </button>
            )}
          </div>
        </motion.div>

        {/* REEL DIRECTORY */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]"
        >
          {/* SEARCH HEADER */}
          <div className="flex flex-col gap-4 border-b border-[#DCE6F2] p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#111827]">
                Reel Directory
              </h2>

              <p className="mt-1 text-xs text-[#6B7280]">
                {filteredReels.length}{" "}
                {filteredReels.length === 1
                  ? "reel"
                  : "reels"}{" "}
                found
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <FiSearch
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search reels, creator or ID..."
                className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-10 pr-10 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex -translate-y-1/2 text-[#6B7280] hover:text-[#2D6FE8]"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>

          {/* LOADING */}
          {initialReelsLoading ? (
            <div className="flex flex-col items-center px-5 py-20 text-center sm:px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiRefreshCw
                  size={22}
                  className="animate-spin"
                />
              </div>

              <p className="mt-4 text-sm font-bold text-[#111827]">
                Loading reels...
              </p>
            </div>
          ) : loading && reels.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-20 text-center sm:px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiRefreshCw
                  size={22}
                  className="animate-spin"
                />
              </div>

              <p className="mt-4 text-sm font-bold text-[#111827]">
                Loading reels...
              </p>
            </div>
          ) : filteredReels.length === 0 ? (
            /* EMPTY STATE */
            <div className="px-5 py-20 text-center sm:px-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]">
                <FiFilm size={27} />
              </div>

              <h3 className="mt-5 text-base font-semibold text-[#111827]">
                {search
                  ? "No reels found"
                  : "No reels available"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6B7280]">
                {search
                  ? "Try searching with another title, creator or reel ID."
                  : "Add your first reel to start managing social content."}
              </p>

              {!search && canCreateReels && (
                <button
                  type="button"
                  onClick={openAdd}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.5)] transition hover:-translate-y-0.5"
                >
                  <FiPlus size={16} />
                  Add Reel
                </button>
              )}
            </div>
          ) : (
            /* REELS GRID */
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
                    canEdit={canUpdateReels}
                    canDelete={canDeleteReels}
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
        canSubmit={
          modalMode === "add"
            ? canCreateReels
            : canUpdateReels
        }
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
