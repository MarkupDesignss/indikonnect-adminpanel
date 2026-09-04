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
} from "react-icons/fi";

import GlobalModal from "@/components/common/GlobalModal";

import brandsApi, {
  Brand,
  BrandPayload,
} from "../../api/endpoints/brands";

// =====================================================
// CONSTANTS
// =====================================================

const GOLD = "#b8902e";
const DARK_GOLD = "#8f6d1d";
const PAGE_BG = "#f7f5ef";

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
      type: "spring" as const,
      stiffness: 110,
      damping: 16,
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

const getImageUrl = (
  url?: string | null
) => {
  if (!url) {
    return "";
  }

  return url;
};

// =====================================================
// ERROR MESSAGE HELPER
// =====================================================

const getApiErrorMessage = (
  error: any,
  fallback: string
) => {
  const responseData =
    error?.response?.data;

  if (
    typeof responseData === "string" &&
    responseData.trim()
  ) {
    return responseData;
  }

  if (
    responseData?.message &&
    typeof responseData.message === "string"
  ) {
    return responseData.message;
  }

  if (
    responseData?.error &&
    typeof responseData.error === "string"
  ) {
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

const BrandFormModal: React.FC<
  BrandFormModalProps
> = ({
  open,
  loading,
  mode,
  brand,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] =
    useState("");

  const [
    discountPercentage,
    setDiscountPercentage,
  ] = useState("");

  const [logoFile, setLogoFile] =
    useState<File | null>(null);

  const [bannerFile, setBannerFile] =
    useState<File | null>(null);

  const [logoPreview, setLogoPreview] =
    useState("");

  const [bannerPreview, setBannerPreview] =
    useState("");

  const logoInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const bannerInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const logoObjectUrlRef =
    useRef<string | null>(null);

  const bannerObjectUrlRef =
    useRef<string | null>(null);

  // ===================================================
  // CLEAN OBJECT URLS
  // ===================================================

  const cleanupObjectUrls = () => {
    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(
        logoObjectUrlRef.current
      );

      logoObjectUrlRef.current = null;
    }

    if (bannerObjectUrlRef.current) {
      URL.revokeObjectURL(
        bannerObjectUrlRef.current
      );

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
      setTitle(
        brand.title || ""
      );

      setDiscountPercentage(
        brand.discount_percentage !==
          undefined &&
          brand.discount_percentage !==
            null
          ? String(
              brand.discount_percentage
            )
          : ""
      );

      setLogoFile(null);

      setLogoPreview(
        getImageUrl(
          brand.logo
        )
      );

      setBannerFile(null);

      setBannerPreview(
        getImageUrl(
          brand.banner
        )
      );
    } else {
      setTitle("");
      setDiscountPercentage("");

      setLogoFile(null);
      setLogoPreview("");

      setBannerFile(null);
      setBannerPreview("");
    }

    if (logoInputRef.current) {
      logoInputRef.current.value =
        "";
    }

    if (bannerInputRef.current) {
      bannerInputRef.current.value =
        "";
    }

    return () => {
      cleanupObjectUrls();
    };
  }, [
    open,
    mode,
    brand,
  ]);

  // ===================================================
  // LOGO CHANGE
  // ===================================================

  const handleLogoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      toast.error(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      toast.error(
        "Logo size should be less than 5MB."
      );

      event.target.value = "";
      return;
    }

    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(
        logoObjectUrlRef.current
      );
    }

    const preview =
      URL.createObjectURL(file);

    logoObjectUrlRef.current =
      preview;

    setLogoFile(file);
    setLogoPreview(preview);
  };

  // ===================================================
  // BANNER CHANGE
  // ===================================================

  const handleBannerChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      toast.error(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      toast.error(
        "Banner size should be less than 10MB."
      );

      event.target.value = "";
      return;
    }

    if (
      bannerObjectUrlRef.current
    ) {
      URL.revokeObjectURL(
        bannerObjectUrlRef.current
      );
    }

    const preview =
      URL.createObjectURL(file);

    bannerObjectUrlRef.current =
      preview;

    setBannerFile(file);
    setBannerPreview(preview);
  };

  // ===================================================
  // RESET LOGO
  // ===================================================

  const removeLogo = () => {
    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(
        logoObjectUrlRef.current
      );

      logoObjectUrlRef.current =
        null;
    }

    setLogoFile(null);

    if (
      mode === "edit" &&
      brand?.logo
    ) {
      setLogoPreview(
        getImageUrl(
          brand.logo
        )
      );
    } else {
      setLogoPreview("");
    }

    if (logoInputRef.current) {
      logoInputRef.current.value =
        "";
    }
  };

  // ===================================================
  // RESET BANNER
  // ===================================================

  const removeBanner = () => {
    if (
      bannerObjectUrlRef.current
    ) {
      URL.revokeObjectURL(
        bannerObjectUrlRef.current
      );

      bannerObjectUrlRef.current =
        null;
    }

    setBannerFile(null);

    if (
      mode === "edit" &&
      brand?.banner
    ) {
      setBannerPreview(
        getImageUrl(
          brand.banner
        )
      );
    } else {
      setBannerPreview("");
    }

    if (bannerInputRef.current) {
      bannerInputRef.current.value =
        "";
    }
  };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = () => {
    const trimmedTitle =
      title.trim();

    if (!trimmedTitle) {
      toast.error(
        "Please enter brand heading."
      );
      return;
    }

    if (
      discountPercentage.trim() ===
      ""
    ) {
      toast.error(
        "Please enter discount percentage."
      );
      return;
    }

    const percentage =
      Number(discountPercentage);

    if (
      Number.isNaN(
        percentage
      )
    ) {
      toast.error(
        "Please enter a valid percentage."
      );
      return;
    }

    if (
      percentage < 0 ||
      percentage > 100
    ) {
      toast.error(
        "Percentage must be between 0 and 100."
      );
      return;
    }

    // CREATE REQUIREMENTS
    if (
      mode === "add" &&
      !logoFile
    ) {
      toast.error(
        "Please upload brand logo."
      );
      return;
    }

    if (
      mode === "add" &&
      !bannerFile
    ) {
      toast.error(
        "Please upload brand banner."
      );
      return;
    }

    const payload: BrandPayload =
      {
        title: trimmedTitle,
        discount_percentage:
          percentage,
      };

    if (logoFile) {
      payload.logo = logoFile;
    }

    if (bannerFile) {
      payload.banner =
        bannerFile;
    }

    onSubmit(payload);
  };

  // ===================================================
  // CLOSE
  // ===================================================

  const handleClose = () => {
    if (loading) {
      return;
    }

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
      closeOnOverlayClick={
        !loading
      }
      title=""
    >
      <div className="w-full max-w-[640px] overflow-hidden rounded-[20px] border border-[#b8902e]/15 bg-white shadow-2xl">
        {/* GOLD LINE */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${GOLD}16`,
                color: GOLD,
              }}
            >
              <FiImage size={18} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === "add"
                  ? "Add Brand"
                  : "Update Brand"}
              </h2>

              <p className="mt-0.5 truncate text-xs text-gray-500">
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
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[72vh] overflow-y-auto px-5 py-5">
          <div className="space-y-4">
            {/* TITLE */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Brand Heading
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                disabled={loading}
                placeholder="e.g. PUMA"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10 disabled:bg-gray-100"
              />
            </div>

            {/* PERCENTAGE */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Discount Percentage
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={
                    discountPercentage
                  }
                  onChange={(e) =>
                    setDiscountPercentage(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  placeholder="20"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10 disabled:bg-gray-100"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                  %
                </span>
              </div>
            </div>

            {/* LOGO */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">
                  Brand Logo
                  {mode === "add" && (
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  )}
                </label>

                <span className="text-[10px] text-gray-400">
                  Max 5MB
                </span>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={
                  handleLogoChange
                }
                disabled={loading}
                className="hidden"
              />

              {!logoPreview ? (
                <button
                  type="button"
                  onClick={() =>
                    logoInputRef.current?.click()
                  }
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-7 transition hover:border-[#b8902e] hover:bg-[#b8902e]/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${GOLD}15`,
                      color: GOLD,
                    }}
                  >
                    <FiUpload size={19} />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-700">
                      Upload Brand Logo
                    </p>

                    <p className="mt-0.5 text-[10px] text-gray-400">
                      PNG, JPG, JPEG or WEBP
                    </p>
                  </div>
                </button>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    {/* PREVIEW */}
                    <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <img
                        src={
                          logoPreview
                        }
                        alt={
                          title ||
                          "Brand logo"
                        }
                        className="h-full w-full object-contain p-2"
                      />
                    </div>

                    {/* DETAILS */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {logoFile?.name ||
                          "Current brand logo"}
                      </p>

                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {logoFile
                          ? "New logo selected"
                          : "Current uploaded logo"}
                      </p>

                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            logoInputRef.current?.click()
                          }
                          disabled={
                            loading
                          }
                          className="text-xs font-semibold"
                          style={{
                            color:
                              DARK_GOLD,
                          }}
                        >
                          Change Logo
                        </button>

                        {logoFile && (
                          <button
                            type="button"
                            onClick={
                              removeLogo
                            }
                            disabled={
                              loading
                            }
                            className="text-xs font-semibold text-red-500"
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
                <label className="block text-xs font-semibold text-gray-700">
                  Brand Banner
                  {mode === "add" && (
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  )}
                </label>

                <span className="text-[10px] text-gray-400">
                  Max 10MB
                </span>
              </div>

              <input
                ref={bannerInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={
                  handleBannerChange
                }
                disabled={loading}
                className="hidden"
              />

              {!bannerPreview ? (
                <button
                  type="button"
                  onClick={() =>
                    bannerInputRef.current?.click()
                  }
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-7 transition hover:border-[#b8902e] hover:bg-[#b8902e]/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${GOLD}15`,
                      color: GOLD,
                    }}
                  >
                    <FiUpload size={19} />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-700">
                      Upload Brand Banner
                    </p>

                    <p className="mt-0.5 text-[10px] text-gray-400">
                      PNG, JPG, JPEG or WEBP (1920x500 recommended)
                    </p>
                  </div>
                </button>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center gap-3">
                    {/* PREVIEW */}
                    <div className="flex h-[72px] w-[128px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <img
                        src={
                          bannerPreview
                        }
                        alt={
                          title ||
                          "Brand banner"
                        }
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* DETAILS */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {bannerFile?.name ||
                          "Current brand banner"}
                      </p>

                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {bannerFile
                          ? "New banner selected"
                          : "Current uploaded banner"}
                      </p>

                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            bannerInputRef.current?.click()
                          }
                          disabled={
                            loading
                          }
                          className="text-xs font-semibold"
                          style={{
                            color:
                              DARK_GOLD,
                          }}
                        >
                          Change Banner
                        </button>

                        {bannerFile && (
                          <button
                            type="button"
                            onClick={
                              removeBanner
                            }
                            disabled={
                              loading
                            }
                            className="text-xs font-semibold text-red-500"
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
                <p className="text-xs font-semibold text-gray-700">
                  Live Preview
                </p>

                <span className="text-[10px] text-gray-400">
                  Preview
                </span>
              </div>

              <div className="relative overflow-hidden rounded-[18px] bg-[#f1f1f1] p-5">
                {bannerPreview && (
                  <div className="mb-4 h-[100px] w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <img
                      src={
                        bannerPreview
                      }
                      alt="Banner Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      {title ||
                        "BRAND NAME"}
                    </p>

                    <h3 className="text-[25px] font-medium leading-none text-gray-900">
                      {discountPercentage ||
                        "20"}
                      % Off
                    </h3>
                  </div>

                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
                    {logoPreview ? (
                      <img
                        src={
                          logoPreview
                        }
                        alt="Preview"
                        className="h-full w-full object-contain p-2.5"
                      />
                    ) : (
                      <FiImage
                        className="text-gray-300"
                        size={22}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-gray-100 bg-white px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-[#b8902e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9f7a25] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <FiRefreshCw
                size={14}
                className="animate-spin"
              />
            )}

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
  onEdit: (
    brand: Brand
  ) => void;
}

const BrandCard: React.FC<
  BrandCardProps
> = ({
  brand,
  onEdit,
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className="group relative overflow-hidden rounded-[18px] bg-[#f1f1f1] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* BANNER */}
      {brand.banner && (
        <div className="absolute inset-0 opacity-20">
          <img
            src={getImageUrl(
              brand.banner
            )}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* INFO */}
      <div className="relative z-10">
        <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
          {brand.title}
        </p>

        <h3 className="text-[24px] font-medium leading-none text-gray-900">
          {Number(
            brand.discount_percentage
          ) || 0}
          % Off
        </h3>
      </div>

      {/* LOGO */}
      <div className="relative z-10 mt-5 flex items-center">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
          {brand.logo ? (
            <img
              src={getImageUrl(
                brand.logo
              )}
              alt={
                brand.title
              }
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <FiImage
              size={20}
              className="text-gray-300"
            />
          )}
        </div>
      </div>

      {/* EDIT ACTION */}
      <div className="relative z-10 mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            onEdit(brand)
          }
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:border-[#b8902e] hover:text-[#b8902e]"
          title="Edit"
        >
          <FiEdit2 size={14} />
        </button>
      </div>
    </motion.div>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const BrandsManagement: React.FC =
  () => {
    const [brands, setBrands] =
      useState<Brand[]>([]);

    const [loading, setLoading] =
      useState(false);

    const [saveLoading, setSaveLoading] =
      useState(false);

    const [search, setSearch] =
      useState("");

    const [addEditOpen, setAddEditOpen] =
      useState(false);

    const [modalMode, setModalMode] =
      useState<"add" | "edit">(
        "add"
      );

    const [
      selectedBrand,
      setSelectedBrand,
    ] = useState<Brand | null>(
      null
    );

    // =================================================
    // FETCH
    // =================================================

    const fetchBrands = async () => {
      try {
        setLoading(true);

        const response =
          await brandsApi.getAll();

        if (
          response.data.success
        ) {
          setBrands(
            response.data.data ||
              []
          );
        } else {
          toast.error(
            response.data.message ||
              "Unable to fetch brands."
          );
        }
      } catch (error: any) {
        console.error(
          "Fetch brands error:",
          error
        );

        toast.error(
          getApiErrorMessage(
            error,
            "Unable to fetch brands."
          )
        );
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

    const filteredBrands =
      useMemo(() => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return brands;
        }

        return brands.filter(
          (brand) =>
            brand.title
              ?.toLowerCase()
              .includes(query) ||
            String(
              brand.discount_percentage
            ).includes(query)
        );
      }, [
        brands,
        search,
      ]);

    // =================================================
    // ADD
    // =================================================

    const openAdd = () => {
      setSelectedBrand(
        null
      );

      setModalMode("add");

      setAddEditOpen(true);
    };

    // =================================================
    // EDIT
    // =================================================

    const openEdit = (
      brand: Brand
    ) => {
      setSelectedBrand(
        brand
      );

      setModalMode("edit");

      setAddEditOpen(true);
    };

    // =================================================
    // SAVE
    // =================================================

    const handleSave = async (
      payload: BrandPayload
    ) => {
      try {
        setSaveLoading(true);

        if (
          modalMode === "edit" &&
          selectedBrand
        ) {
          const response =
            await brandsApi.update(
              selectedBrand.id,
              payload
            );

          console.log(
            "UPDATE BRAND RESPONSE:",
            response.data
          );

          if (
            response.data.success
          ) {
            toast.success(
              response.data.message ||
                "Brand updated successfully."
            );

            setAddEditOpen(
              false
            );

            setSelectedBrand(
              null
            );

            await fetchBrands();
          } else {
            toast.error(
              response.data.message ||
                "Unable to update brand."
            );
          }
        } else {
          const response =
            await brandsApi.create(
              payload
            );

          console.log(
            "CREATE BRAND RESPONSE:",
            response.data
          );

          if (
            response.data.success
          ) {
            toast.success(
              response.data.message ||
                "Brand created successfully."
            );

            setAddEditOpen(
              false
            );

            setSelectedBrand(
              null
            );

            await fetchBrands();
          } else {
            toast.error(
              response.data.message ||
                "Unable to create brand."
            );
          }
        }
      } catch (error: any) {
        console.error(
          "Save brand error:",
          error
        );

        console.error(
          "Save brand error response:",
          error?.response?.data
        );

        toast.error(
          getApiErrorMessage(
            error,
            "Something went wrong while saving brand."
          )
        );
      } finally {
        setSaveLoading(
          false
        );
      }
    };

    // =================================================
    // LOADING
    // =================================================

    if (
      loading &&
      brands.length === 0
    ) {
      return (
        <div
          className="flex min-h-screen items-center justify-center"
          style={{
            backgroundColor:
              PAGE_BG,
          }}
        >
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-gray-200 border-t-[#b8902e]" />

            <p className="mt-3 text-sm text-gray-500">
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
        variants={
          containerVariants
        }
        className="min-h-screen px-4 py-5 sm:px-6 lg:px-8"
        style={{
          backgroundColor:
            PAGE_BG,
        }}
      >
        <div className="mx-auto max-w-[1500px]">
          {/* HEADER */}
          <motion.div
            variants={
              itemVariants
            }
            className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center"
          >
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a741b]">
                  Brand Management
                </span>
              </div>

              <h1 className="font-serif text-[29px] font-semibold tracking-tight text-gray-900 sm:text-[32px]">
                Brands
              </h1>

              <p className="mt-1.5 text-sm text-gray-500">
                Manage brand logos,
                banners and
                discount
                percentages.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* REFRESH */}
              <button
                type="button"
                onClick={
                  fetchBrands
                }
                disabled={
                  loading
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiRefreshCw
                  size={16}
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

              {/* ADD BRAND */}
              <button
                type="button"
                onClick={
                  openAdd
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#b8902e] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#9e7925]"
              >
                <FiPlus
                  size={17}
                />

                Add Brand
              </button>
            </div>
          </motion.div>

          {/* MAIN CARD */}
          <motion.div
            variants={
              itemVariants
            }
            className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-sm"
          >
            {/* GOLD LINE */}
            <div
              className="h-[3px] w-full"
              style={{
                background:
                  `linear-gradient(90deg, ${GOLD}, #d7bd72, ${GOLD})`,
              }}
            />

            {/* TOOLBAR */}
            <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Brand Management
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {
                    filteredBrands.length
                  }{" "}
                  {filteredBrands.length ===
                  1
                    ? "brand"
                    : "brands"}{" "}
                  found
                </p>
              </div>

              {/* SEARCH */}
              <div className="relative w-full md:max-w-sm">
                <FiSearch
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search brand..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    className="absolute right-3 top-1/2 flex -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* EMPTY */}
            {filteredBrands.length ===
            0 ? (
              <div className="px-5 py-20 text-center sm:px-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#b8902e]/10 text-[#b8902e]">
                  <FiImage
                    size={26}
                  />
                </div>

                <h3 className="mt-5 text-base font-semibold text-gray-900">
                  {search
                    ? "No brands found"
                    : "No brands available"}
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                  {search
                    ? "Try searching with another brand name."
                    : "Add your first brand to start managing brand discounts."}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={
                      openAdd
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#b8902e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#9e7925]"
                  >
                    <FiPlus
                      size={16}
                    />
                    Add Brand
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
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                >
                  {filteredBrands.map(
                    (
                      brand
                    ) => (
                      <BrandCard
                        key={
                          brand.id
                        }
                        brand={
                          brand
                        }
                        onEdit={
                          openEdit
                        }
                      />
                    )
                  )}
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>

        {/* ADD / EDIT MODAL */}
        <BrandFormModal
          open={
            addEditOpen
          }
          loading={
            saveLoading
          }
          mode={
            modalMode
          }
          brand={
            selectedBrand
          }
          onClose={() => {
            if (
              !saveLoading
            ) {
              setAddEditOpen(
                false
              );

              setSelectedBrand(
                null
              );
            }
          }}
          onSubmit={
            handleSave
          }
        />
      </motion.div>
    );
  };

export default BrandsManagement;