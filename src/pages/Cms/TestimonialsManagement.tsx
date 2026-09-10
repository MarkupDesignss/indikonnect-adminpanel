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
} from "react-icons/fi";

import GlobalModal from "@/components/common/GlobalModal";
import testimonialsApi, { Testimonial } from "../../api/endpoints/testimonials";

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
// HELPERS
// =====================================================

const getVideoUrl = (testimonial: Testimonial | null) => {
  if (!testimonial) return "";
  return testimonial.video_path || "";
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
// STAR RATING DISPLAY (GREEN)
// =====================================================

const StarRatingDisplay: React.FC<{ rating: string | number }> = ({
  rating,
}) => {
  const numRating = typeof rating === "string" ? parseFloat(rating) : rating;
  const fullStars = Math.floor(numRating / 2);
  const hasHalfStar = (numRating / 2) % 1 >= 0.5;
  const totalStars = 5;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(totalStars)].map((_, i) => {
        if (i < fullStars) {
          return (
            <FiStar key={i} className="h-3 w-3 fill-[#4C8A57] text-[#163F20]" />
          );
        } else if (i === fullStars && hasHalfStar) {
          return (
            <div key={i} className="relative">
              <FiStar className="h-3 w-3 text-[#D8E2D8]" />
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <FiStar className="h-3 w-3 fill-[#4C8A57] text-[#163F20]" />
              </div>
            </div>
          );
        } else {
          return <FiStar key={i} className="h-3 w-3 text-[#D8E2D8]" />;
        }
      })}
      <span className="ml-1 text-xs font-semibold text-[#3F4A41]">
        {typeof rating === "string"
          ? parseFloat(rating).toFixed(1)
          : rating.toFixed(1)}
      </span>
    </div>
  );
};

// =====================================================
// FORM MODAL
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

    if (mode === "edit" && testimonial) {
      setPersonName(testimonial.person_name || "");
      setRating(String(testimonial.rating || ""));
      setText(testimonial.text || "");
      setVideoPreview(getVideoUrl(testimonial));
    } else {
      setPersonName("");
      setRating("");
      setText("");
      setVideoFile(null);
      setVideoPreview("");
    }

    if (videoInputRef.current) videoInputRef.current.value = "";

    return () => {
      cleanupPreviewUrls();
    };
  }, [open, mode, testimonial]);

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

  const resetVideo = () => {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }

    setVideoFile(null);

    if (mode === "edit" && testimonial) {
      setVideoPreview(getVideoUrl(testimonial));
    } else {
      setVideoPreview("");
    }

    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleSubmit = () => {
    const trimmedPersonName = personName.trim();
    const trimmedRating = rating.trim();
    const trimmedText = text.trim();

    if (!trimmedPersonName) {
      toast.error("Please enter person name.");
      return;
    }

    if (!trimmedRating) {
      toast.error("Please enter rating.");
      return;
    }

    const ratingNum = parseFloat(trimmedRating);
    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
      toast.error("Please enter a valid rating between 0 and 10.");
      return;
    }

    if (!trimmedText) {
      toast.error("Please enter testimonial text.");
      return;
    }

    if (mode === "add" && !videoFile) {
      toast.error("Please upload a video.");
      return;
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
    const numRating = parseFloat(rating) / 2;
    if (isNaN(numRating)) return null;

    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    const totalStars = 5;

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(totalStars)].map((_, i) => {
          if (i < fullStars) {
            return (
              <FiStar
                key={i}
                className="h-4 w-4 fill-[#4C8A57] text-[#163F20]"
              />
            );
          } else if (i === fullStars && hasHalfStar) {
            return (
              <div key={i} className="relative">
                <FiStar className="h-4 w-4 text-[#D8E2D8]" />
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <FiStar className="h-4 w-4 fill-[#4C8A57] text-[#163F20]" />
                </div>
              </div>
            );
          } else {
            return <FiStar key={i} className="h-4 w-4 text-[#D8E2D8]" />;
          }
        })}
        <span className="ml-1 text-sm font-semibold text-[#3F4A41]">
          {rating ? parseFloat(rating).toFixed(1) : "0.0"} / 10
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
      <div className="w-full max-w-[650px] overflow-hidden rounded-[20px] border border-[#E5EAE5] bg-white shadow-2xl">
        {/* TOP LINE */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-[#163F20]/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EA] text-[#163F20]">
              <FiMessageSquare size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#202721]">
                {mode === "add" ? "Add Testimonial" : "Update Testimonial"}
              </h2>

              <p className="mt-0.5 text-xs text-[#59645C]">
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
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#59645C] transition hover:bg-[#EAF3EA] hover:text-[#163F20] disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[76vh] overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            {/* PERSON NAME */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#3F4A41]">
                Person Name <span className="ml-1 text-[#C23B32]">*</span>
              </label>

              <div className="relative">
                <FiUser
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
                />

                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  disabled={loading}
                  placeholder="Enter person name"
                  className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white pl-10 pr-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10"
                />
              </div>
            </div>

            {/* RATING */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#3F4A41]">
                Rating (0-10) <span className="ml-1 text-[#C23B32]">*</span>
              </label>

              <div className="relative">
                <FiStar
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
                />

                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  disabled={loading}
                  placeholder="Enter rating (e.g., 8.5)"
                  className="h-11 w-full rounded-xl border border-[#D8E2D8] bg-white pl-10 pr-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10"
                />
              </div>

              <div className="mt-2 flex items-center gap-3">
                {renderStarPreview()}
                <span className="text-[10px] text-[#9AA29C]">
                  Rating out of 10
                </span>
              </div>
            </div>

            {/* TEXT */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#3F4A41]">
                Testimonial Text <span className="ml-1 text-[#C23B32]">*</span>
              </label>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loading}
                rows={4}
                placeholder="Write the testimonial text here..."
                className="w-full rounded-xl border border-[#D8E2D8] bg-white px-4 py-3 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/10"
              />
            </div>

            {/* VIDEO */}
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
                      Upload Testimonial Video
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
                        {videoFile?.name || "Current video"}
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
            className="flex min-w-[125px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(22,63,32,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
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
                Delete Testimonial?
              </h2>

              <p className="mt-1.5 text-xs leading-5 text-[#59645C]">
                This action will permanently remove the selected testimonial.
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
              {testimonial?.video_path ? (
                <video
                  src={testimonial.video_path}
                  className="h-full w-full object-cover"
                  muted
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[#8FC199]">
                  <FiFilm size={18} />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#202721]">
                {testimonial?.person_name || "Selected Testimonial"}
              </p>

              <p className="mt-0.5 text-xs text-[#59645C]">
                Rating: {testimonial?.rating || "N/A"}/10
              </p>
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
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// TESTIMONIAL CARD
// =====================================================

interface TestimonialCardProps {
  testimonial: Testimonial;
  serialNumber: number;
  onEdit: (testimonial: Testimonial) => void;
  onDelete: (testimonial: Testimonial) => void;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  testimonial,
  serialNumber,
  onEdit,
  onDelete,
}) => {
  const videoUrl = getVideoUrl(testimonial);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3 }}
      className="group overflow-hidden rounded-[18px] border border-[#E5EAE5] bg-white shadow-sm transition-all duration-300 hover:border-[#163F20]/30 hover:shadow-[0_15px_35px_rgba(22,63,32,0.08)]"
    >
      {/* VIDEO */}
      <div className="relative aspect-[9/11] overflow-hidden bg-[#161412]">
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
            <FiMessageSquare size={35} className="text-[#8FC199]" />
          </div>
        )}

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />

        {/* SERIAL */}
        <span className="absolute left-3 top-3 rounded-lg bg-black/55 px-2 py-1 text-[9px] font-bold text-white">
          #{serialNumber}
        </span>

        {/* BOTTOM */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-2">
            <StarRatingDisplay rating={testimonial.rating} />
          </div>

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

      {/* DETAILS */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
              Person
            </p>

            <p className="mt-1 truncate text-xs font-semibold text-[#202721]">
              {testimonial.person_name}
            </p>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-[#163F20]">
            <FiStar size={12} className="fill-[#4C8A57] text-[#163F20]" />

            <span className="font-semibold">
              {parseFloat(testimonial.rating).toFixed(1)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#163F20]/10 pt-3">
          <div className="text-[10px] text-[#9AA29C]">
            {formatDate(testimonial.created_at)}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(testimonial)}
              title="Edit Testimonial"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E2D8] bg-white text-[#59645C] transition hover:border-[#163F20] hover:text-[#163F20]"
            >
              <FiEdit2 size={14} />
            </button>

            <button
              type="button"
              onClick={() => onDelete(testimonial)}
              title="Delete Testimonial"
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

const TestimonialsManagement: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);

  // =================================================
  // FETCH
  // =================================================

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await testimonialsApi.getAll();

      if (response.data?.data?.data) {
        setTestimonials(response.data.data.data);
      } else {
        setTestimonials([]);
        toast.error(response.data?.message || "Unable to fetch testimonials.");
      }
    } catch (error: any) {
      console.error("Fetch testimonials error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to fetch testimonials.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // =================================================
  // SEARCH
  // =================================================

  const filteredTestimonials = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return testimonials;

    return testimonials.filter(
      (testimonial) =>
        testimonial.person_name?.toLowerCase().includes(query) ||
        testimonial.text?.toLowerCase().includes(query) ||
        String(testimonial.id).includes(query),
    );
  }, [testimonials, search]);

  const totalTestimonials = testimonials.length;

  // =================================================
  // HANDLERS
  // =================================================

  const openAdd = () => {
    setSelectedTestimonial(null);
    setModalMode("add");
    setAddEditOpen(true);
  };

  const openEdit = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setModalMode("edit");
    setAddEditOpen(true);
  };

  const openDelete = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setDeleteOpen(true);
  };

  const handleSave = async (payload: FormData) => {
    try {
      setSaveLoading(true);

      let response;

      if (modalMode === "edit" && selectedTestimonial) {
        response = await testimonialsApi.update(
          selectedTestimonial.id,
          payload,
        );
      } else {
        response = await testimonialsApi.create(payload);
      }

      if (response.data?.success !== false) {
        toast.success(
          response.data?.message ||
            (modalMode === "edit"
              ? "Testimonial updated successfully."
              : "Testimonial created successfully."),
        );

        setAddEditOpen(false);
        setSelectedTestimonial(null);
        await fetchTestimonials();
      } else {
        toast.error(response.data?.message || "Unable to save testimonial.");
      }
    } catch (error: any) {
      console.error("Save testimonial error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong while saving testimonial.",
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTestimonial) return;

    try {
      setDeleteLoading(true);
      const response = await testimonialsApi.delete(selectedTestimonial.id);

      if (response.data?.success !== false) {
        toast.success(
          response.data?.message || "Testimonial deleted successfully.",
        );

        setDeleteOpen(false);
        setSelectedTestimonial(null);
        await fetchTestimonials();
      } else {
        toast.error(response.data?.message || "Unable to delete testimonial.");
      }
    } catch (error: any) {
      console.error("Delete testimonial error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong while deleting testimonial.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // =================================================
  // LOADING
  // =================================================

  if (loading && testimonials.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#EAF3EA] border-t-[#163F20]" />

          <p className="mt-3 text-sm text-[#59645C]">Loading testimonials...</p>
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
              Testimonials
            </h1>

            <p className="mt-1 text-sm text-[#59645C]">
              Manage customer testimonials, videos, and ratings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchTestimonials}
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
              Add Testimonial
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
                  Total Testimonials
                </p>

                <p className="mt-2 text-[26px] font-bold tracking-tight text-[#202721]">
                  {totalTestimonials}
                </p>

                <p className="mt-1 text-[11px] text-[#59645C]">
                  All customer testimonials
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#EAF3EA] text-[#163F20]">
                <FiMessageSquare size={21} />
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
                  With Videos
                </p>

                <p className="mt-2 text-[26px] font-bold tracking-tight text-[#202721]">
                  {testimonials.filter((t) => t.video_path).length}
                </p>

                <p className="mt-1 text-[11px] text-[#59645C]">
                  Video testimonials uploaded
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
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#163F20] to-[#4C8A57]" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9AA29C]">
                  Average Rating
                </p>

                <p className="mt-2 text-[26px] font-bold tracking-tight text-[#202721]">
                  {testimonials.length > 0
                    ? (
                        testimonials.reduce(
                          (sum, t) => sum + parseFloat(String(t.rating || 0)),
                          0,
                        ) / testimonials.length
                      ).toFixed(1)
                    : "0.0"}
                </p>

                <p className="mt-1 text-[11px] text-[#59645C]">
                  Out of 10 average
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#EAF3EA] text-[#163F20]">
                <FiStar size={21} className="fill-[#4C8A57]" />
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
                Testimonial Directory
              </h2>

              <p className="mt-1 text-xs text-[#59645C]">
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
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search testimonials, person or ID..."
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
          {filteredTestimonials.length === 0 ? (
            <div className="px-5 py-20 text-center sm:px-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF3EA] text-[#163F20]">
                <FiMessageSquare size={27} />
              </div>

              <h3 className="mt-5 text-base font-semibold text-[#202721]">
                {search ? "No testimonials found" : "No testimonials available"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#59645C]">
                {search
                  ? "Try searching with another person name or ID."
                  : "Add your first testimonial to start managing customer feedback."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAdd}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_18px_-8px_rgba(22,63,32,0.5)] transition hover:-translate-y-0.5"
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
                  />
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      {/* MODALS */}
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
    </motion.div>
  );
};

export default TestimonialsManagement;
