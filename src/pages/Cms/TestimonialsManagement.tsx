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
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUpload,
  FiX,
  FiCheckCircle,
  FiStar,
  FiUser,
  FiMessageSquare,
  FiAlertCircle,
} from "react-icons/fi";
import GlobalModal from "@/components/common/GlobalModal";
import testimonialsApi, { Testimonial } from "../../api/endpoints/testimonials";
import logoApi from "../../api/endpoints/logoApi";
import { usePermissions } from "../../pages/permissions/usePermissions";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

// =====================================================
// DEFAULT LOGO
// =====================================================
const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

  
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
// HELPERS
// =====================================================
const getVideoUrl = (testimonial: Testimonial | null) =>
  testimonial?.video_path || "";

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

const normalizeRating = (rating: string | number) => {
  const value =
    typeof rating === "number" ? rating : Number.parseFloat(rating);

  return Number.isFinite(value) ? Math.min(10, Math.max(0, value)) : 0;
};

// =====================================================
// STAR RATING DISPLAY
// =====================================================
const StarRatingDisplay: React.FC<{ rating: string | number }> = ({
  rating,
}) => {
  const stars = normalizeRating(rating) / 2;
  const fullStars = Math.floor(stars);
  const hasHalfStar = stars - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => {
        if (index < fullStars) {
          return (
            <FiStar
              key={index}
              className="h-3 w-3 fill-[#FACC15] text-[#FACC15]"
            />
          );
        }

        if (index === fullStars && hasHalfStar) {
          return (
            <span key={index} className="relative inline-flex">
              <FiStar className="h-3 w-3 text-white/45" />
              <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                <FiStar className="h-3 w-3 fill-[#FACC15] text-[#FACC15]" />
              </span>
            </span>
          );
        }

        return <FiStar key={index} className="h-3 w-3 text-white/45" />;
      })}

      <span className="ml-1 text-xs font-semibold text-white">
        {normalizeRating(rating).toFixed(1)}
      </span>
    </div>
  );
};

// =====================================================
// TESTIMONIAL FORM MODAL
// =====================================================
interface TestimonialFormModalProps {
  open: boolean;
  loading: boolean;
  mode: "add" | "edit";
  testimonial: Testimonial | null;
  onClose: () => void;
  onSubmit: (payload: FormData) => void;
}

const TestimonialFormModal: React.FC<TestimonialFormModalProps> = ({
  open,
  loading,
  mode,
  testimonial,
  onClose,
  onSubmit,
}) => {
  const [personName, setPersonName] = useState("");
  const [rating, setRating] = useState("");
  const [text, setText] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");

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
    setVideoFile(null);

    if (mode === "edit" && testimonial) {
      setPersonName(testimonial.person_name || "");
      setRating(String(testimonial.rating ?? ""));
      setText(testimonial.text || "");
      setVideoPreview(getVideoUrl(testimonial));
    } else {
      setPersonName("");
      setRating("");
      setText("");
      setVideoPreview("");
    }

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }

    return () => cleanupPreviewUrls();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, testimonial]);

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
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

    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
    }

    const url = URL.createObjectURL(file);

    videoObjectUrlRef.current = url;
    setVideoFile(file);
    setVideoPreview(url);
  };

  const resetVideo = () => {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }

    setVideoFile(null);

    setVideoPreview(
      mode === "edit" && testimonial ? getVideoUrl(testimonial) : ""
    );

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    const trimmedPersonName = personName.trim();
    const trimmedRating = rating.trim();
    const trimmedText = text.trim();

    if (!trimmedPersonName) {
      return void toast.error("Please enter person name.");
    }

    if (!trimmedRating) {
      return void toast.error("Please enter rating.");
    }

    const ratingNum = Number.parseFloat(trimmedRating);

    if (
      !Number.isFinite(ratingNum) ||
      ratingNum < 0 ||
      ratingNum > 10
    ) {
      toast.error("Please enter a valid rating between 0 and 10.");
      return;
    }

    if (!trimmedText) {
      return void toast.error("Please enter testimonial text.");
    }

    if (mode === "add" && !videoFile) {
      return void toast.error("Please upload a video.");
    }

    const formData = new FormData();

    formData.append("person_name", trimmedPersonName);
    formData.append("rating", String(ratingNum));
    formData.append("text", trimmedText);

    if (videoFile instanceof File) {
      formData.append("video", videoFile, videoFile.name);
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    if (loading) return;

    cleanupPreviewUrls();
    onClose();
  };

  const renderStarPreview = () => {
    if (!rating.trim()) return null;

    const stars = normalizeRating(rating) / 2;
    const fullStars = Math.floor(stars);
    const hasHalfStar = stars - fullStars >= 0.5;

    return (
      <div className="flex flex-wrap items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => {
          if (index < fullStars) {
            return (
              <FiStar
                key={index}
                className="h-4 w-4 fill-[#FACC15] text-[#FACC15]"
              />
            );
          }

          if (index === fullStars && hasHalfStar) {
            return (
              <span key={index} className="relative inline-flex">
                <FiStar className="h-4 w-4 text-[#DCE6F2]" />
                <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                  <FiStar className="h-4 w-4 fill-[#FACC15] text-[#FACC15]" />
                </span>
              </span>
            );
          }

          return (
            <FiStar key={index} className="h-4 w-4 text-[#DCE6F2]" />
          );
        })}

        <span className="ml-1 text-sm font-semibold text-[#4B5563]">
          {normalizeRating(rating).toFixed(1)} / 10
        </span>
      </div>
    );
  };

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
              <FiMessageSquare size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#111827]">
                {mode === "add" ? "Add Testimonial" : "Update Testimonial"}
              </h2>

              <p className="mt-0.5 text-xs text-[#4B5563]">
                {mode === "add"
                  ? "Create a new customer testimonial."
                  : "Update testimonial content and details."}
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
              <label className="mb-1.5 block text-xs font-semibold text-[#4B5563]">
                Person Name{" "}
                <span className="ml-1 text-[#C23B32]">*</span>
              </label>

              <div className="relative">
                <FiUser
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                />

                <input
                  type="text"
                  value={personName}
                  onChange={(event) => setPersonName(event.target.value)}
                  disabled={loading}
                  placeholder="Enter person name"
                  className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-white pl-10 pr-4 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#4B5563]">
                Rating (0-10){" "}
                <span className="ml-1 text-[#C23B32]">*</span>
              </label>

              <div className="relative">
                <FiStar
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A16207]"
                />

                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                  disabled={loading}
                  placeholder="Enter rating (e.g., 8.5)"
                  className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-white pl-10 pr-4 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10"
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                {renderStarPreview()}
                <span className="text-[10px] text-[#6B7280]">
                  Rating out of 10
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#4B5563]">
                Testimonial Text{" "}
                <span className="ml-1 text-[#C23B32]">*</span>
              </label>

              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                disabled={loading}
                rows={4}
                placeholder="Write the testimonial text here..."
                className="w-full rounded-xl border border-[#DCE6F2] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#4B5563]">
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
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-4 rounded-xl border border-dashed border-[#DCE6F2] bg-[#F4F8FD] px-5 py-7 transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                    <FiUpload size={19} />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#111827]">
                      Upload Testimonial Video
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#6B7280]">
                      MP4, MOV, WEBM or other supported video
                    </p>
                  </div>
                </button>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
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
                      <p className="truncate text-sm font-semibold text-[#111827]">
                        {videoFile?.name || "Current video"}
                      </p>

                      <p className="mt-1 text-[10px] text-[#6B7280]">
                        {videoFile
                          ? "New video selected"
                          : "Current uploaded video"}
                      </p>

                      <div className="mt-3 flex gap-3">
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
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
            className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#4B5563] transition hover:bg-[#F4F8FD] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex min-w-[125px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <FiRefreshCw size={14} className="animate-spin" />
                {mode === "add" ? "Creating..." : "Updating..."}
              </>
            ) : mode === "add" ? (
              <>
                <FiPlus size={15} />
                Create Testimonial
              </>
            ) : (
              <>
                <FiCheckCircle size={15} />
                Update Testimonial
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
interface DeleteTestimonialModalProps {
  open: boolean;
  loading: boolean;
  testimonial: Testimonial | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteTestimonialModal: React.FC<DeleteTestimonialModalProps> = ({
  open,
  loading,
  testimonial,
  onClose,
  onConfirm,
}) => (
  <GlobalModal
    isOpen={open}
    onClose={() => !loading && onClose()}
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
              Delete Testimonial?
            </h2>

            <p className="mt-1.5 text-xs leading-5 text-[#4B5563]">
              This action will permanently remove the selected testimonial.
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
          <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-black">
            {testimonial?.video_path ? (
              <video
                src={testimonial.video_path}
                className="h-full w-full object-cover"
                muted
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#4F8FF7]">
                <FiFilm size={18} />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">
              {testimonial?.person_name || "Selected Testimonial"}
            </p>

            <p className="mt-0.5 text-xs text-[#4B5563]">
              Rating: {testimonial?.rating ?? "N/A"}/10
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-xl border border-[#DCE6F2] bg-white px-5 py-2.5 text-sm font-medium text-[#4B5563] transition hover:bg-[#F4F8FD] disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C23B32] to-[#A62F27] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(194,59,50,0.5)] transition hover:-translate-y-0.5 disabled:opacity-50"
        >
          {loading ? (
            <>
              <FiRefreshCw size={14} className="animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <FiTrash2 size={14} />
              Delete
            </>
          )}
        </button>
      </div>
    </div>
  </GlobalModal>
);

// =====================================================
// TESTIMONIAL CARD
// =====================================================
interface TestimonialCardProps {
  testimonial: Testimonial;
  serialNumber: number;
  onEdit: (testimonial: Testimonial) => void;
  onDelete: (testimonial: Testimonial) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  testimonial,
  serialNumber,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) => {
  const videoUrl = getVideoUrl(testimonial);
  const hasAnyAction = canEdit || canDelete;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      className="group overflow-hidden rounded-[18px] border border-[#DCE6F2] bg-white shadow-sm transition-all duration-300 hover:border-[#2D6FE8]/30 hover:shadow-[0_15px_35px_rgba(45,111,232,0.10)]"
    >
      <div className="relative aspect-[9/11] overflow-hidden bg-[#111827]">
        {videoUrl ? (
          <video
            src={videoUrl}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FiMessageSquare size={35} className="text-[#4F8FF7]" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />

        <span className="absolute left-3 top-3 rounded-lg bg-black/55 px-2 py-1 text-[9px] font-bold text-white">
          #{serialNumber}
        </span>

        <span className="absolute right-3 top-3 rounded-full border border-white/30 bg-white/95 px-2.5 py-1 text-[9px] font-bold text-[#2D6FE8]">
          Customer Story
        </span>

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <StarRatingDisplay rating={testimonial.rating} />

          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5">
            {testimonial.person_name}
          </h3>

          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-white/65">
            <span className="flex items-center gap-1.5">
              <FiMessageSquare size={11} />
              Testimonial
            </span>

            <span>{formatDate(testimonial.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
              Person
            </p>

            <p className="mt-1 truncate text-xs font-semibold text-[#111827]">
              {testimonial.person_name}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[#FEF9C3] px-2 py-1.5 text-[10px] text-[#A16207]">
            <FiStar size={12} className="fill-[#FACC15] text-[#A16207]" />

            <span className="font-semibold">
              {normalizeRating(testimonial.rating).toFixed(1)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#DCE6F2] pt-3">
          <div className="text-[10px] text-[#6B7280]">
            {formatDate(testimonial.created_at)}
          </div>

          {hasAnyAction && (
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(testimonial)}
                  title="Edit Testimonial"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#4B5563] transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
                >
                  <FiEdit2 size={14} />
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(testimonial)}
                  title="Delete Testimonial"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DCE6F2] bg-white text-[#4B5563] transition hover:border-[#C23B32] hover:bg-[#FEF2F2] hover:text-[#C23B32]"
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};


const AccessDenied: React.FC = () => (
  <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-4 font-poppins">
    <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-lg">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
        <FiAlertCircle size={26} />
      </div>

      <h2 className="text-lg font-bold text-[#111827]">
        Access Denied
      </h2>

      <p className="mt-2 text-sm text-[#6B7280]">
        You don't have permission to access the Testimonials Management
        module.
      </p>

      <div className="mt-5 rounded-xl border border-[#C23B32]/15 bg-[#FEF2F2] px-4 py-3 text-[10px] font-semibold text-[#C23B32]">
        Contact your administrator to request access.
      </div>
    </div>
  </div>
);

// =====================================================
// MAIN COMPONENT
// =====================================================
const TestimonialsManagement: React.FC = () => {
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewTestimonials = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("content") ||
      hasModuleAccess("testimonial") ||
      hasPermission("content.view") ||
      hasPermission("testimonial.view"),
    [isSuperAdmin, hasModuleAccess, hasPermission]
  );

  const canCreateTestimonial = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("content.create") ||
      hasPermission("testimonial.create"),
    [isSuperAdmin, hasPermission]
  );

  const canUpdateTestimonial = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("content.edit") ||
      hasPermission("content.update") ||
      hasPermission("testimonial.edit"),
    [isSuperAdmin, hasPermission]
  );

  const canDeleteTestimonial = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("content.delete") ||
      hasPermission("testimonial.delete"),
    [isSuperAdmin, hasPermission]
  );

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  // Normal API loading state for refresh and data actions
  const [loading, setLoading] = useState(false);

  // Separate initial data loading state
  const [initialDataLoading, setInitialDataLoading] = useState(true);

  // Separate loader logo loading state
  const [logoLoading, setLogoLoading] = useState(true);

  // Loader logo URL, independent of testimonial data
  const [loaderLogoUrl, setLoaderLogoUrl] = useState<string>(
    DEFAULT_LOGO_URL
  );

  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);

  const fetchInFlightRef = useRef<Promise<void> | null>(null);
  const hasInitialFetchRef = useRef(false);

  // =====================================================
  // FETCH LOGO FROM LOGO API
  // Default logo stays available if API fails.
  // =====================================================
  useEffect(() => {
    let isMounted = true;

    const fetchLoaderLogo = async () => {
      try {
        const response = await logoApi.getLogo();
        const responseData = response?.data as any;

        const receivedLogo =
          responseData?.data?.logo ||
          responseData?.logo ||
          responseData?.data?.data?.logo ||
          responseData?.data?.data?.data?.logo;

        if (
          isMounted &&
          typeof receivedLogo === "string" &&
          receivedLogo.trim()
        ) {
          setLoaderLogoUrl(receivedLogo.trim());
        }
      } catch (error) {
        console.error("Fetch loader logo error:", error);

        if (isMounted) {
          setLoaderLogoUrl(DEFAULT_LOGO_URL);
        }
      } finally {
        if (isMounted) {
          setLogoLoading(false);
        }
      }
    };

    void fetchLoaderLogo();

    return () => {
      isMounted = false;
    };
  }, []);

  // =====================================================
  // FETCH TESTIMONIALS
  // isInitialLoad controls the initial page loader only.
  // Refresh/save/delete keep the regular loading state.
  // =====================================================
  const fetchTestimonials = async (
    force = false,
    isInitialLoad = false
  ) => {
    if (fetchInFlightRef.current) {
      try {
        await fetchInFlightRef.current;
      } finally {
        if (isInitialLoad) {
          setInitialDataLoading(false);
        }
      }

      return;
    }

    if (!force && hasInitialFetchRef.current) {
      if (isInitialLoad) {
        setInitialDataLoading(false);
      }

      return;
    }

    if (!canViewTestimonials) {
      if (isInitialLoad) {
        setInitialDataLoading(false);
      }

      return;
    }

    const request = (async () => {
      try {
        setLoading(true);

        const response = await testimonialsApi.getAll();
        const data = response.data?.data?.data;

        if (Array.isArray(data)) {
          setTestimonials(data);
          hasInitialFetchRef.current = true;
        } else {
          setTestimonials([]);

          toast.error(
            response.data?.message ||
              "Unable to fetch testimonials."
          );
        }
      } catch (error: any) {
        console.error("Fetch testimonials error:", error);

        toast.error(
          error?.response?.data?.message ||
            "Unable to fetch testimonials."
        );
      } finally {
        setLoading(false);

        if (isInitialLoad) {
          setInitialDataLoading(false);
        }
      }
    })();

    fetchInFlightRef.current = request;

    try {
      await request;
    } finally {
      fetchInFlightRef.current = null;
    }
  };

  // =====================================================
  // WAIT FOR PERMISSIONS BEFORE FETCHING TESTIMONIALS
  // =====================================================
  useEffect(() => {
    if (permissionsLoading) return;

    if (!canViewTestimonials) {
      setInitialDataLoading(false);
      return;
    }

    if (!hasInitialFetchRef.current) {
      void fetchTestimonials(false, true);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canViewTestimonials]);

  const filteredTestimonials = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return testimonials;

    return testimonials.filter(
      (testimonial) =>
        testimonial.person_name?.toLowerCase().includes(query) ||
        testimonial.text?.toLowerCase().includes(query) ||
        String(testimonial.id).includes(query)
    );
  }, [testimonials, search]);

  const totalTestimonials = testimonials.length;

  const videoTestimonials = testimonials.filter((item) =>
    Boolean(item.video_path)
  ).length;

  const averageRating = testimonials.length
    ? (
        testimonials.reduce(
          (sum, item) => sum + normalizeRating(item.rating),
          0
        ) / testimonials.length
      ).toFixed(1)
    : "0.0";

  const openAdd = () => {
    if (!canCreateTestimonial) {
      return void toast.error(
        "You do not have permission to create testimonials."
      );
    }

    setSelectedTestimonial(null);
    setModalMode("add");
    setAddEditOpen(true);
  };

  const openEdit = (testimonial: Testimonial) => {
    if (!canUpdateTestimonial) {
      return void toast.error(
        "You do not have permission to update testimonials."
      );
    }

    setSelectedTestimonial(testimonial);
    setModalMode("edit");
    setAddEditOpen(true);
  };

  const openDelete = (testimonial: Testimonial) => {
    if (!canDeleteTestimonial) {
      return void toast.error(
        "You do not have permission to delete testimonials."
      );
    }

    setSelectedTestimonial(testimonial);
    setDeleteOpen(true);
  };

  const handleSave = async (payload: FormData) => {
    const canSave =
      modalMode === "add"
        ? canCreateTestimonial
        : canUpdateTestimonial;

    if (!canSave) {
      return void toast.error(
        `You do not have permission to ${
          modalMode === "add" ? "create" : "update"
        } testimonials.`
      );
    }

    if (saveLoading) return;

    try {
      setSaveLoading(true);

      const response =
        modalMode === "edit" && selectedTestimonial
          ? await testimonialsApi.update(
              selectedTestimonial.id,
              payload
            )
          : await testimonialsApi.create(payload);

      if (response.data?.success !== false) {
        toast.success(
          response.data?.message ||
            (modalMode === "edit"
              ? "Testimonial updated successfully."
              : "Testimonial created successfully.")
        );

        setAddEditOpen(false);
        setSelectedTestimonial(null);

        // Refresh data without reopening the initial logo loader.
        await fetchTestimonials(true);
      } else {
        toast.error(
          response.data?.message ||
            "Unable to save testimonial."
        );
      }
    } catch (error: any) {
      console.error("Save testimonial error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Something went wrong while saving testimonial."
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDeleteTestimonial) {
      return void toast.error(
        "You do not have permission to delete testimonials."
      );
    }

    if (!selectedTestimonial || deleteLoading) return;

    try {
      setDeleteLoading(true);

      const response = await testimonialsApi.delete(
        selectedTestimonial.id
      );

      if (response.data?.success !== false) {
        toast.success(
          response.data?.message ||
            "Testimonial deleted successfully."
        );

        setDeleteOpen(false);
        setSelectedTestimonial(null);

        // Refresh data without reopening the initial logo loader.
        await fetchTestimonials(true);
      } else {
        toast.error(
          response.data?.message ||
            "Unable to delete testimonial."
        );
      }
    } catch (error: any) {
      console.error("Delete testimonial error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Something went wrong while deleting testimonial."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // =====================================================
  // COMBINED INITIAL LOADING STATE
  // =====================================================
  const pageLoading =
    permissionsLoading || logoLoading || initialDataLoading;

  if (pageLoading) {
    return <PermissionLoadingState logoUrl={loaderLogoUrl} />;
  }

  if (!canViewTestimonials) {
    return <AccessDenied />;
  }

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
              <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2D6FE8]">
                Content Management
              </span>
            </div>

            <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
              Testimonials
            </h1>

            <p className="mt-0.5 text-sm text-[#111827]">
              Manage customer testimonials, videos, and ratings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void fetchTestimonials(true)}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm font-medium text-[#4B5563] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:opacity-50"
            >
              <FiRefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>

            {canCreateTestimonial && (
              <button
                type="button"
                onClick={openAdd}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.6)]"
              >
                <FiPlus size={16} />
                Add Testimonial
              </button>
            )}
          </div>
        </motion.div>

        {/* DIRECTORY */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]"
        >
          <div className="flex flex-col gap-4 border-b border-[#DCE6F2] p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#111827]">
                Testimonial Directory
              </h2>

              <p className="mt-1 text-xs text-[#4B5563]">
                {filteredTestimonials.length}{" "}
                {filteredTestimonials.length === 1
                  ? "testimonial"
                  : "testimonials"}{" "}
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
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search testimonials, person or ID..."
                className="h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-10 pr-10 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 flex -translate-y-1/2 text-[#6B7280] hover:text-[#2D6FE8]"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>

          {filteredTestimonials.length === 0 ? (
            <div className="px-5 py-20 text-center sm:px-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF3FF] text-[#2D6FE8]">
                <FiMessageSquare size={27} />
              </div>

              <h3 className="mt-5 text-base font-semibold text-[#111827]">
                {search
                  ? "No testimonials found"
                  : "No testimonials available"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#4B5563]">
                {search
                  ? "Try searching with another person name or ID."
                  : "Add your first testimonial to start managing customer feedback."}
              </p>

              {!search && canCreateTestimonial && (
                <button
                  type="button"
                  onClick={openAdd}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_18px_-8px_rgba(45,111,232,0.5)] transition hover:-translate-y-0.5"
                >
                  <FiPlus size={16} />
                  Add Testimonial
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
                {filteredTestimonials.map((testimonial, index) => (
                  <TestimonialCard
                    key={testimonial.id}
                    testimonial={testimonial}
                    serialNumber={index + 1}
                    onEdit={openEdit}
                    onDelete={openDelete}
                    canEdit={canUpdateTestimonial}
                    canDelete={canDeleteTestimonial}
                  />
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      {(canCreateTestimonial || canUpdateTestimonial) && (
        <TestimonialFormModal
          open={addEditOpen}
          loading={saveLoading}
          mode={modalMode}
          testimonial={selectedTestimonial}
          onClose={() => {
            if (!saveLoading) {
              setAddEditOpen(false);
              setSelectedTestimonial(null);
            }
          }}
          onSubmit={handleSave}
        />
      )}

      {canDeleteTestimonial && (
        <DeleteTestimonialModal
          open={deleteOpen}
          loading={deleteLoading}
          testimonial={selectedTestimonial}
          onClose={() => {
            if (!deleteLoading) {
              setDeleteOpen(false);
              setSelectedTestimonial(null);
            }
          }}
          onConfirm={handleDelete}
        />
      )}
    </motion.div>
  );
};

export default TestimonialsManagement;