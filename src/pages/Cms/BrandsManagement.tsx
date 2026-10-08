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
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUpload,
  FiX,
  FiTag,
  FiPercent,
  FiCheckCircle,
} from "react-icons/fi";

import GlobalModal from "@/components/common/GlobalModal";

import brandsApi, { Brand, BrandPayload } from "../../api/endpoints/brands";

// =====================================================
// THEME (BLUE + YELLOW) — matches UserManagement
// =====================================================

const BLUE = "#2D6FE8";
const BLUE_LIGHT = "#4F8FF7";
const BLUE_MID = "#5A95F6";
const BLUE_TINT = "#EAF3FF";
const BLUE_SOFT_BG = "#F4F8FD";
const BLUE_BORDER = "#D6E2F0";
const BLUE_BORDER_SOFT = "#DCE6F2";

const AMBER = "#F2C94C";
const AMBER_BG = "#FFF7D6";
const AMBER_TEXT = "#A16207";

const RED = "#C23B32";
const RED_BG = "#EEF5FF";

const TEXT = "#111827";
const TEXT_MUTED = "#6B7280";

const PAGE_BG = "#F4F8FD";

// =====================================================
// ANIMATIONS
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 18,
    },
  },
};

// =====================================================
// TYPES
// =====================================================

interface BrandFormModalProps {
  open: boolean;
  loading: boolean;
  mode: "add" | "edit";
  brand: Brand | null;
  onClose: () => void;
  onSubmit: (payload: BrandPayload) => void;
}

// =====================================================
// IMAGE URL
// =====================================================

const getImageUrl = (url?: string | null) => {
  if (!url) return "";
  return url;
};

// =====================================================
// ERROR MESSAGE HELPER
// =====================================================

const getApiErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (responseData?.message && typeof responseData.message === "string") {
    return responseData.message;
  }

  if (responseData?.error && typeof responseData.error === "string") {
    return responseData.error;
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

// =====================================================
// BRAND FORM MODAL
// =====================================================

const BrandFormModal: React.FC<BrandFormModalProps> = ({
  open,
  loading,
  mode,
  brand,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const logoObjectUrlRef = useRef<string | null>(null);
  const bannerObjectUrlRef = useRef<string | null>(null);

  // ===================================================
  // CLEAN OBJECT URLS
  // ===================================================

  const cleanupObjectUrls = () => {
    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(logoObjectUrlRef.current);
      logoObjectUrlRef.current = null;
    }

    if (bannerObjectUrlRef.current) {
      URL.revokeObjectURL(bannerObjectUrlRef.current);
      bannerObjectUrlRef.current = null;
    }
  };

  // ===================================================
  // INITIALIZE
  // ===================================================

  useEffect(() => {
    if (!open) {
      cleanupObjectUrls();
      return;
    }

    cleanupObjectUrls();

    if (mode === "edit" && brand) {
      setTitle(brand.title || "");
      setDiscountPercentage(
        brand.discount_percentage !== undefined &&
          brand.discount_percentage !== null
          ? String(brand.discount_percentage)
          : ""
      );
      setLogoFile(null);
      setLogoPreview(getImageUrl(brand.logo));
      setBannerFile(null);
      setBannerPreview(getImageUrl(brand.banner));
    } else {
      setTitle("");
      setDiscountPercentage("");
      setLogoFile(null);
      setLogoPreview("");
      setBannerFile(null);
      setBannerPreview("");
    }

    if (logoInputRef.current) logoInputRef.current.value = "";
    if (bannerInputRef.current) bannerInputRef.current.value = "";

    return () => {
      cleanupObjectUrls();
    };
  }, [open, mode, brand]);

  // ===================================================
  // LOGO CHANGE
  // ===================================================

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo size should be less than 5MB.");
      event.target.value = "";
      return;
    }

    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(logoObjectUrlRef.current);
    }

    const preview = URL.createObjectURL(file);
    logoObjectUrlRef.current = preview;
    setLogoFile(file);
    setLogoPreview(preview);
  };

  // ===================================================
  // BANNER CHANGE
  // ===================================================

  const handleBannerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Banner size should be less than 10MB.");
      event.target.value = "";
      return;
    }

    if (bannerObjectUrlRef.current) {
      URL.revokeObjectURL(bannerObjectUrlRef.current);
    }

    const preview = URL.createObjectURL(file);
    bannerObjectUrlRef.current = preview;
    setBannerFile(file);
    setBannerPreview(preview);
  };

  // ===================================================
  // RESET LOGO
  // ===================================================

  const removeLogo = () => {
    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(logoObjectUrlRef.current);
      logoObjectUrlRef.current = null;
    }

    setLogoFile(null);

    if (mode === "edit" && brand?.logo) {
      setLogoPreview(getImageUrl(brand.logo));
    } else {
      setLogoPreview("");
    }

    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  // ===================================================
  // RESET BANNER
  // ===================================================

  const removeBanner = () => {
    if (bannerObjectUrlRef.current) {
      URL.revokeObjectURL(bannerObjectUrlRef.current);
      bannerObjectUrlRef.current = null;
    }

    setBannerFile(null);

    if (mode === "edit" && brand?.banner) {
      setBannerPreview(getImageUrl(brand.banner));
    } else {
      setBannerPreview("");
    }

    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      toast.error("Please enter brand heading.");
      return;
    }

    if (discountPercentage.trim() === "") {
      toast.error("Please enter discount percentage.");
      return;
    }

    const percentage = Number(discountPercentage);

    if (Number.isNaN(percentage)) {
      toast.error("Please enter a valid percentage.");
      return;
    }

    if (percentage < 0 || percentage > 100) {
      toast.error("Percentage must be between 0 and 100.");
      return;
    }

    if (mode === "add" && !logoFile) {
      toast.error("Please upload brand logo.");
      return;
    }

    if (mode === "add" && !bannerFile) {
      toast.error("Please upload brand banner.");
      return;
    }

    const payload: BrandPayload = {
      title: trimmedTitle,
      discount_percentage: percentage,
    };

    if (logoFile) payload.logo = logoFile;
    if (bannerFile) payload.banner = bannerFile;

    onSubmit(payload);
  };

  // ===================================================
  // CLOSE
  // ===================================================

  const handleClose = () => {
    if (loading) return;
    cleanupObjectUrls();
    onClose();
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <GlobalModal
      isOpen={open}
      onClose={handleClose}
      closeOnOverlayClick={!loading}
      title=""
    >
      <div className="w-full max-w-[660px] overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white shadow-2xl">
        {/* TOP GRADIENT BAR — BLUE */}
        <div className="h-1 w-full bg-gradient-to-r from-[#2D6FE8] via-[#5A95F6] to-[#8BB7FF]" />

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-[#2D6FE8]/10 bg-gradient-to-br from-[#EAF3FF]/70 to-white px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] text-white shadow-sm">
              <FiImage size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#111827]">
                {mode === "add" ? "Add Brand" : "Update Brand"}
              </h2>

              <p className="mt-0.5 truncate text-xs text-[#6B7280]">
                {mode === "add"
                  ? "Add brand logo, banner and discount percentage."
                  : "Update brand details, logo and banner."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[72vh] overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            {/* TITLE + PERCENTAGE ROW */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* TITLE */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#111827]">
                  Brand Heading
                  <span className="ml-1 text-[#C23B32]">*</span>
                </label>

                <div className="relative">
                  <FiTag
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                  />

                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                    placeholder="e.g. PUMA"
                    className="h-11 w-full rounded-lg border border-[#D6E2F0] bg-white pl-10 pr-4 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10 disabled:bg-[#F4F8FD]"
                  />
                </div>
              </div>

              {/* PERCENTAGE */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#111827]">
                  Discount Percentage
                  <span className="ml-1 text-[#C23B32]">*</span>
                </label>

                <div className="relative">
                  <FiPercent
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
                  />

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    disabled={loading}
                    placeholder="20"
                    className="h-11 w-full rounded-lg border border-[#D6E2F0] bg-white pl-10 pr-12 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2D6FE8] focus:ring-2 focus:ring-[#2D6FE8]/10 disabled:bg-[#F4F8FD]"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6B7280]">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* LOGO */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#111827]">
                  Brand Logo
                  {mode === "add" && (
                    <span className="ml-1 text-[#C23B32]">*</span>
                  )}
                </label>

                <span className="text-[10px] text-[#6B7280]">Max 5MB</span>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleLogoChange}
                disabled={loading}
                className="hidden"
              />

              {!logoPreview ? (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-4 rounded-xl border border-dashed border-[#D6E2F0] bg-[#F4F8FD] px-5 py-6 transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8] transition group-hover:bg-[#2D6FE8] group-hover:text-white">
                    <FiUpload size={19} />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#111827]">
                      Upload Brand Logo
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#6B7280]">
                      PNG, JPG, JPEG or WEBP
                    </p>
                  </div>
                </button>
              ) : (
                <div className="rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D6E2F0] bg-white">
                      <img
                        src={logoPreview}
                        alt={title || "Brand logo"}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#111827]">
                        {logoFile?.name || "Current brand logo"}
                      </p>

                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#6B7280]">
                        {logoFile ? (
                          <>
                            <FiCheckCircle
                              size={11}
                              className="text-[#2D6FE8]"
                            />
                            New logo selected
                          </>
                        ) : (
                          "Current uploaded logo"
                        )}
                      </p>

                      <div className="mt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={loading}
                          className="text-xs font-semibold text-[#2D6FE8] hover:underline"
                        >
                          Change Logo
                        </button>

                        {logoFile && (
                          <button
                            type="button"
                            onClick={removeLogo}
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

            {/* BANNER */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#111827]">
                  Brand Banner
                  {mode === "add" && (
                    <span className="ml-1 text-[#C23B32]">*</span>
                  )}
                </label>

                <span className="text-[10px] text-[#6B7280]">Max 10MB</span>
              </div>

              <input
                ref={bannerInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleBannerChange}
                disabled={loading}
                className="hidden"
              />

              {!bannerPreview ? (
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-4 rounded-xl border border-dashed border-[#D6E2F0] bg-[#F4F8FD] px-5 py-6 transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8] transition group-hover:bg-[#2D6FE8] group-hover:text-white">
                    <FiUpload size={19} />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#111827]">
                      Upload Brand Banner
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#6B7280]">
                      PNG, JPG, JPEG or WEBP (1920x500 recommended)
                    </p>
                  </div>
                </button>
              ) : (
                <div className="rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-[72px] w-[128px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D6E2F0] bg-white">
                      <img
                        src={bannerPreview}
                        alt={title || "Brand banner"}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#111827]">
                        {bannerFile?.name || "Current brand banner"}
                      </p>

                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#6B7280]">
                        {bannerFile ? (
                          <>
                            <FiCheckCircle
                              size={11}
                              className="text-[#2D6FE8]"
                            />
                            New banner selected
                          </>
                        ) : (
                          "Current uploaded banner"
                        )}
                      </p>

                      <div className="mt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={loading}
                          className="text-xs font-semibold text-[#2D6FE8] hover:underline"
                        >
                          Change Banner
                        </button>

                        {bannerFile && (
                          <button
                            type="button"
                            onClick={removeBanner}
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

            {/* PREVIEW */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-semibold text-[#111827]">
                  Live Preview
                </p>

                <span className="rounded-full bg-[#EAF3FF] px-2 py-0.5 text-[10px] font-semibold text-[#2D6FE8]">
                  Preview
                </span>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-gradient-to-br from-[#F4F8FD] to-[#EAF3FF] p-5">
                {bannerPreview && (
                  <div className="mb-4 h-[110px] w-full overflow-hidden rounded-xl border border-[#D6E2F0] bg-white shadow-sm">
                    <img
                      src={bannerPreview}
                      alt="Banner Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2D6FE8]">
                      {title || "BRAND NAME"}
                    </p>

                    <h3 className="text-[26px] font-medium leading-none text-[#111827]">
                      {discountPercentage || "20"}% Off
                    </h3>
                  </div>

                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D6E2F0] bg-white shadow-sm">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Preview"
                        className="h-full w-full object-contain p-2.5"
                      />
                    ) : (
                      <FiImage className="text-[#9CA3AF]" size={22} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-[#DCE6F2] bg-gradient-to-r from-white to-[#EAF3FF]/40 px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg border border-[#D6E2F0] bg-white px-5 py-2.5 text-sm font-medium text-[#111827] transition hover:bg-[#F4F8FD] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2D6FE8]/20 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <FiRefreshCw size={14} className="animate-spin" />}

            {loading
              ? mode === "add"
                ? "Creating..."
                : "Updating..."
              : mode === "add"
                ? "Create Brand"
                : "Update Brand"}
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// BRAND CARD
// =====================================================

interface BrandCardProps {
  brand: Brand;
  onEdit: (brand: Brand) => void;
}

const BrandCard: React.FC<BrandCardProps> = ({ brand, onEdit }) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white shadow-sm transition-all hover:border-[#2D6FE8]/40 hover:shadow-[0_16px_30px_-18px_rgba(45,111,232,0.35)]"
    >
      {/* BANNER */}
      <div className="relative h-[110px] w-full overflow-hidden bg-gradient-to-br from-[#EAF3FF] to-[#F4F8FD]">
        {brand.banner ? (
          <img
            src={getImageUrl(brand.banner)}
            alt={`${brand.title} banner`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#2D6FE8]/40">
            <FiImage size={28} />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

        {/* DISCOUNT PILL — AMBER */}
        <div className="absolute right-3 top-3 rounded-full border border-[#F2C94C]/50 bg-[#FFF7D6]/95 px-2.5 py-1 text-[11px] font-bold text-[#A16207] shadow-sm backdrop-blur-sm">
          {Number(brand.discount_percentage) || 0}% OFF
        </div>
      </div>

      {/* BODY */}
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* LOGO */}
          <div className="-mt-9 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
            {brand.logo ? (
              <img
                src={getImageUrl(brand.logo)}
                alt={brand.title}
                className="h-full w-full object-contain p-1.5"
              />
            ) : (
              <FiImage size={20} className="text-[#9CA3AF]" />
            )}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2D6FE8]">
              Brand
            </p>

            <h3 className="mt-0.5 truncate text-base font-semibold text-[#111827]">
              {brand.title}
            </h3>
          </div>
        </div>

        {/* EDIT ACTION */}
        <div className="mt-4 flex items-center justify-between border-t border-[#2D6FE8]/10 pt-3">
          <span className="text-[11px] font-medium text-[#6B7280]">
            Discount:{" "}
            <span className="font-bold text-[#2D6FE8]">
              {Number(brand.discount_percentage) || 0}%
            </span>
          </span>

          <button
            type="button"
            onClick={() => onEdit(brand)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6E2F0] bg-white text-[#6B7280] transition hover:border-[#2D6FE8] hover:bg-[#EAF3FF] hover:text-[#2D6FE8]"
            title="Edit brand"
          >
            <FiEdit2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const BrandsManagement: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // =================================================
  // FETCH
  // =================================================

  const fetchBrands = async () => {
    try {
      setLoading(true);

      const response = await brandsApi.getAll();

      if (response.data.success) {
        setBrands(response.data.data || []);
      } else {
        toast.error(response.data.message || "Unable to fetch brands.");
      }
    } catch (error: any) {
      console.error("Fetch brands error:", error);
      toast.error(getApiErrorMessage(error, "Unable to fetch brands."));
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // INITIAL
  // =================================================

  useEffect(() => {
    fetchBrands();
  }, []);

  // =================================================
  // SEARCH
  // =================================================

  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return brands;

    return brands.filter(
      (brand) =>
        brand.title?.toLowerCase().includes(query) ||
        String(brand.discount_percentage).includes(query)
    );
  }, [brands, search]);

  // =================================================
  // ADD
  // =================================================

  const openAdd = () => {
    setSelectedBrand(null);
    setModalMode("add");
    setAddEditOpen(true);
  };

  // =================================================
  // EDIT
  // =================================================

  const openEdit = (brand: Brand) => {
    setSelectedBrand(brand);
    setModalMode("edit");
    setAddEditOpen(true);
  };

  // =================================================
  // SAVE
  // =================================================

  const handleSave = async (payload: BrandPayload) => {
    try {
      setSaveLoading(true);

      if (modalMode === "edit" && selectedBrand) {
        const response = await brandsApi.update(selectedBrand.id, payload);

        if (response.data.success) {
          toast.success(response.data.message || "Brand updated successfully.");
          setAddEditOpen(false);
          setSelectedBrand(null);
          await fetchBrands();
        } else {
          toast.error(response.data.message || "Unable to update brand.");
        }
      } else {
        const response = await brandsApi.create(payload);

        if (response.data.success) {
          toast.success(response.data.message || "Brand created successfully.");
          setAddEditOpen(false);
          setSelectedBrand(null);
          await fetchBrands();
        } else {
          toast.error(response.data.message || "Unable to create brand.");
        }
      }
    } catch (error: any) {
      console.error("Save brand error:", error);
      toast.error(
        getApiErrorMessage(error, "Something went wrong while saving brand.")
      );
    } finally {
      setSaveLoading(false);
    }
  };

  // =================================================
  // LOADING
  // =================================================

  if (loading && brands.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#EAF3FF] border-t-[#2D6FE8]" />

          <p className="mt-3 text-sm font-medium text-[#6B7280]">
            Loading brands...
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
      variants={containerVariants}
      className="min-h-screen px-4 bg-white py-5 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1500px]">
        {/* HEADER */}
        <motion.div
          variants={itemVariants}
          className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center"
        >
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2D6FE8]">
                Brand Management
              </span>
            </div>

            <h1 className="text-[22px] font-semibold tracking-tight text-[#111827] sm:text-[24px]">
              Brands
            </h1>

            <p className="mt-0.5 text-sm text-[#111827]">
              Manage brand logos, banners and discount percentages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* REFRESH */}
            <button
              type="button"
              onClick={fetchBrands}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#D6E2F0] bg-white px-4 text-sm font-medium text-[#111827] transition hover:border-[#2D6FE8]/30 hover:bg-[#EAF3FF] hover:text-[#2D6FE8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* ADD BRAND */}
            <button
              type="button"
              onClick={openAdd}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-5 text-sm font-medium text-white shadow-md shadow-[#2D6FE8]/20 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <FiPlus size={17} />
              Add Brand
            </button>
          </div>
        </motion.div>

        {/* MAIN CARD */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border border-[#DCE6F2] bg-white shadow-sm"
        >
          {/* TOOLBAR */}
          <div className="flex flex-col gap-4 border-b border-[#2D6FE8]/10 bg-gradient-to-r from-white to-[#EAF3FF]/30 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#111827]">
                All Brands
              </h2>

              <p className="mt-1 text-xs text-[#6B7280]">
                {filteredBrands.length}{" "}
                {filteredBrands.length === 1 ? "brand" : "brands"} found
              </p>
            </div>

            {/* SEARCH */}
            <div className="relative w-full md:max-w-sm">
              <FiSearch
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brand..."
                className="h-11 w-full rounded-lg border border-[#D6E2F0] bg-[#F4F8FD] pl-10 pr-10 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
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

          {/* EMPTY */}
          {filteredBrands.length === 0 ? (
            <div className="px-5 py-20 text-center sm:px-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiImage size={26} />
              </div>

              <h3 className="mt-5 text-base font-semibold text-[#111827]">
                {search ? "No brands found" : "No brands available"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6B7280]">
                {search
                  ? "Try searching with another brand name."
                  : "Add your first brand to start managing brand discounts."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAdd}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-[#2D6FE8]/20 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <FiPlus size={16} />
                  Add Brand
                </button>
              )}
            </div>
          ) : (
            <div className="p-5 sm:p-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              >
                {filteredBrands.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} onEdit={openEdit} />
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ADD / EDIT MODAL */}
      <BrandFormModal
        open={addEditOpen}
        loading={saveLoading}
        mode={modalMode}
        brand={selectedBrand}
        onClose={() => {
          if (!saveLoading) {
            setAddEditOpen(false);
            setSelectedBrand(null);
          }
        }}
        onSubmit={handleSave}
      />
    </motion.div>
  );
};

export default BrandsManagement;