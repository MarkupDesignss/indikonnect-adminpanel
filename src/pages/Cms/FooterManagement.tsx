import React, {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiCheck,
  FiEdit3,
  FiGlobe,
  FiImage,
  FiInstagram,
  FiLink,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSave,
  FiTwitter,
  FiUploadCloud,
  FiYoutube,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import footerApi, {
  FooterData,
  FooterUpdatePayload,
} from "../../api/endpoints/footer";

import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// THEME
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
// PERMISSIONS
// =====================================================

const VIEW_PERMISSION_KEYS = [
  "footer.view",
  "Footer.view",
  "footers.view",
  "Footers.view",
];

const UPDATE_PERMISSION_KEYS = [
  "footer.update",
  "Footer.update",
  "footers.update",
  "Footers.update",
  "footer.edit",
  "Footer.edit",
  "footers.edit",
  "Footers.edit",
];

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
  hidden: { opacity: 0, y: 12 },
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

interface FooterForm {
  title: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  twitter: string;
  youtube: string;
  email: string;
  phone: string;
  copyright: string;
  logo: File | null;
}

// =====================================================
// HELPERS
// =====================================================

const valueOrEmpty = (value?: string | null): string => value || "";

const getInitialLogo = (footer: FooterData | null): string | null =>
  footer?.logo_url || null;

// =====================================================
// REUSABLE FIELD
// =====================================================

interface FieldProps {
  label: string;
  value: string;
  placeholder?: string;
  icon?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const FooterField: React.FC<FieldProps> = ({
  label,
  value,
  placeholder,
  icon,
  multiline = false,
  rows = 4,
  disabled = false,
  onChange,
}) => {
  return (
    <div>
      <label
        className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: TEXT_SECONDARY }}
      >
        {icon && (
          <span style={{ color: disabled ? MUTED : PRIMARY }}>
            {icon}
          </span>
        )}

        {label}
      </label>

      {multiline ? (
        <textarea
          value={value}
          rows={rows}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition placeholder:text-[#8C97B2] disabled:cursor-not-allowed disabled:bg-[#EEF3FA] disabled:text-[#8C97B2]"
          style={{
            border: `1px solid ${BORDER}`,
            backgroundColor: disabled ? "#EEF3FA" : PAGE_BG,
            color: TEXT_PRIMARY,
          }}
          onFocus={(event) => {
            if (!disabled) {
              event.currentTarget.style.borderColor = PRIMARY;
              event.currentTarget.style.boxShadow =
                `0 0 0 3px rgba(37, 99, 235, 0.08)`;
              event.currentTarget.style.backgroundColor = WHITE;
            }
          }}
          onBlur={(event) => {
            event.currentTarget.style.borderColor = BORDER;
            event.currentTarget.style.boxShadow = "none";
            event.currentTarget.style.backgroundColor = disabled
              ? "#EEF3FA"
              : PAGE_BG;
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl px-4 text-sm outline-none transition placeholder:text-[#8C97B2] disabled:cursor-not-allowed disabled:bg-[#EEF3FA] disabled:text-[#8C97B2]"
          style={{
            border: `1px solid ${BORDER}`,
            backgroundColor: disabled ? "#EEF3FA" : PAGE_BG,
            color: TEXT_PRIMARY,
          }}
          onFocus={(event) => {
            if (!disabled) {
              event.currentTarget.style.borderColor = PRIMARY;
              event.currentTarget.style.boxShadow =
                `0 0 0 3px rgba(37, 99, 235, 0.08)`;
              event.currentTarget.style.backgroundColor = WHITE;
            }
          }}
          onBlur={(event) => {
            event.currentTarget.style.borderColor = BORDER;
            event.currentTarget.style.boxShadow = "none";
            event.currentTarget.style.backgroundColor = disabled
              ? "#EEF3FA"
              : PAGE_BG;
          }}
        />
      )}
    </div>
  );
};

// =====================================================
// SECTION CARD
// =====================================================

interface SectionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  icon,
  children,
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className="relative overflow-hidden rounded-[20px] border bg-white shadow-[0_8px_30px_rgba(30,58,138,0.06)]"
      style={{ borderColor: "#E0E7F2" }}
    >
      <div
        className="absolute left-0 right-0 top-0 h-[3px]"
        style={{
          background: `linear-gradient(to right, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
        }}
      />

      <div
        className="flex items-center gap-3 border-b px-5 py-4"
        style={{ borderColor: "rgba(30,58,138,0.10)" }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            backgroundColor: LIGHT_BLUE,
            color: PRIMARY,
          }}
        >
          {icon}
        </div>

        <div>
          <h2
            className="text-sm font-bold"
            style={{ color: TEXT_PRIMARY }}
          >
            {title}
          </h2>

          <p
            className="mt-0.5 text-[10px]"
            style={{ color: MUTED }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </motion.div>
  );
};

// =====================================================
// LOGO UPLOADER
// =====================================================

interface LogoUploaderProps {
  currentLogo: string | null;
  selectedFile: File | null;
  disabled?: boolean;
  onChange: (file: File | null) => void;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({
  currentLogo,
  selectedFile,
  disabled = false,
  onChange,
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const image = preview || currentLogo;

  return (
    <div
      className="rounded-[16px] border p-3"
      style={{
        borderColor: "rgba(30,58,138,0.10)",
        backgroundColor: "#FAFBFE",
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm"
            style={{ color: PRIMARY }}
          >
            <FiImage size={14} />
          </div>

          <div>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{ color: MUTED }}
            >
              Footer Logo
            </p>

            <p
              className="text-[10px] font-bold"
              style={{ color: TEXT_SECONDARY }}
            >
              Current Footer Logo
            </p>
          </div>
        </div>

        {selectedFile && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[10px] font-bold transition hover:opacity-80"
            style={{ color: DANGER }}
          >
            Remove
          </button>
        )}
      </div>

      <div
        className="flex h-[100px] items-center justify-center overflow-hidden rounded-lg border bg-white p-3"
        style={{ borderColor: "rgba(30,58,138,0.10)" }}
      >
        {image ? (
          <img
            src={image}
            alt="Footer Logo"
            className="max-h-[80px] max-w-full object-contain"
          />
        ) : (
          <div
            className="text-center"
            style={{ color: MUTED }}
          >
            <FiImage size={24} className="mx-auto" />

            <p className="mt-1 text-[9px]">
              No footer logo available
            </p>
          </div>
        )}
      </div>

      {!disabled && (
        <>
          <label
            className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-[9px] font-bold transition"
            style={{
              borderColor: "rgba(30,58,138,0.20)",
              color: PRIMARY,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = LIGHT_BLUE;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = WHITE;
            }}
          >
            <FiUploadCloud size={13} />

            {selectedFile ? "Change Logo" : "Choose New Logo"}

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(
                event: ChangeEvent<HTMLInputElement>
              ) => {
                onChange(event.target.files?.[0] || null);
                event.target.value = "";
              }}
            />
          </label>

          {selectedFile && (
            <div
              className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[8px] font-semibold"
              style={{
                backgroundColor: LIGHT_BLUE,
                color: PRIMARY,
              }}
            >
              <FiCheck size={11} />
              {selectedFile.name}
            </div>
          )}
        </>
      )}

      {disabled && (
        <div
          className="mt-2 rounded-lg px-3 py-2 text-[9px] font-semibold"
          style={{
            backgroundColor: "#EEF3FA",
            color: MUTED,
          }}
        >
          Update permission is required to change the footer logo.
        </div>
      )}
    </div>
  );
};

// =====================================================
// LOGO FILE PREVIEW
// =====================================================

const LogoPreviewFile: React.FC<{ file: File }> = ({ file }) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!preview) return null;

  return (
    <img
      src={preview}
      alt="Preview"
      className="max-h-full max-w-full object-contain"
    />
  );
};

// =====================================================
// EYE ICON
// =====================================================

const FiEyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 12C2.5 12 6 5 12 5C18 5 21.5 12 21.5 12C21.5 12 18 19 12 19C6 19 2.5 12 2.5 12Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <circle
      cx="12"
      cy="12"
      r="3"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

// =====================================================
// MAIN PAGE
// =====================================================

const FooterManagement: React.FC = () => {
  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  // =================================================
  // PERMISSION HELPERS
  // =================================================

  const hasAnyPermission = (permissions: string[]) =>
    permissions.some((permission) => hasPermission(permission));

  const canViewFooter = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("Footer") ||
      hasModuleAccess("footer") ||
      hasModuleAccess("Footers") ||
      hasModuleAccess("footers") ||
      hasAnyPermission(VIEW_PERMISSION_KEYS),
    [
      isSuperAdmin,
      hasModuleAccess,
      hasPermission,
    ],
  );

  const canUpdateFooter = useMemo(
    () =>
      isSuperAdmin ||
      hasAnyPermission(UPDATE_PERMISSION_KEYS),
    [isSuperAdmin, hasPermission],
  );

  // =================================================
  // STATES
  // =================================================

  const [footer, setFooter] = useState<FooterData | null>(null);

  const [form, setForm] = useState<FooterForm>({
    title: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    twitter: "",
    youtube: "",
    email: "",
    phone: "",
    copyright: "",
    logo: null,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // =================================================
  // FETCH REFS
  // =================================================

  const fetchInFlightRef =
    useRef<Promise<void> | null>(null);

  const hasInitialFetchRef =
    useRef(false);

  // =================================================
  // GET FOOTER
  // =================================================

  const fetchFooter = async (force = false) => {
    if (!canViewFooter) return;

    if (fetchInFlightRef.current) {
      return fetchInFlightRef.current;
    }

    if (!force && hasInitialFetchRef.current) {
      return;
    }

    const requestPromise = (async () => {
      try {
        setLoading(true);

        const response = await footerApi.get();

        if (response?.data?.success) {
          const footerData =
            response?.data?.data?.footer;

          if (!footerData) {
            toast.error("Footer data not found.");
            return;
          }

          setFooter(footerData);

          setForm({
            title: valueOrEmpty(footerData.title),
            instagram: valueOrEmpty(
              footerData.instagram
            ),
            facebook: valueOrEmpty(
              footerData.facebook
            ),
            linkedin: valueOrEmpty(
              footerData.linkedin
            ),
            twitter: valueOrEmpty(
              footerData.twitter
            ),
            youtube: valueOrEmpty(
              footerData.youtube
            ),
            email: valueOrEmpty(
              footerData.email
            ),
            phone: valueOrEmpty(
              footerData.phone
            ),
            copyright: valueOrEmpty(
              footerData.copyright
            ),
            logo: null,
          });

          hasInitialFetchRef.current = true;
        } else {
          toast.error(
            response?.data?.message ||
              "Unable to load footer."
          );
        }
      } catch (error: any) {
        console.error(
          "Fetch footer error:",
          error
        );

        toast.error(
          error?.response?.data?.message ||
            "Unable to load footer."
        );
      } finally {
        setLoading(false);
      }
    })();

    fetchInFlightRef.current = requestPromise;

    try {
      await requestPromise;
    } finally {
      fetchInFlightRef.current = null;
    }
  };

  // =================================================
  // INITIAL FETCH
  // =================================================

  useEffect(() => {
    if (
      !permissionsLoading &&
      canViewFooter &&
      !hasInitialFetchRef.current
    ) {
      fetchFooter();
    }
  }, [
    permissionsLoading,
    canViewFooter,
  ]);

  // =================================================
  // FIELD UPDATE
  // =================================================

  const updateField = (
    field: keyof FooterForm,
    value: string
  ) => {
    if (!canUpdateFooter) return;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // =================================================
  // UPDATE FOOTER
  // =================================================

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!canUpdateFooter) {
      toast.error(
        "You do not have permission to update the footer."
      );
      return;
    }

    if (!form.title.trim()) {
      toast.error("Footer title is required.");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Footer email is required.");
      return;
    }

    if (!form.phone.trim()) {
      toast.error("Footer phone is required.");
      return;
    }

    try {
      setSaving(true);

      const payload: FooterUpdatePayload = {
        logo: form.logo,
        title: form.title.trim(),
        instagram: form.instagram.trim(),
        facebook: form.facebook.trim(),
        linkedin: form.linkedin.trim(),
        twitter: form.twitter.trim(),
        youtube: form.youtube.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        copyright: form.copyright.trim(),
      };

      const response =
        await footerApi.update(payload);

      if (response?.data?.success) {
        toast.success(
          response.data.message ||
            "Footer updated successfully."
        );

        await fetchFooter(true);
      } else {
        toast.error(
          response?.data?.message ||
            "Unable to update footer."
        );
      }
    } catch (error: any) {
      console.error(
        "Update footer error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Unable to update footer."
      );
    } finally {
      setSaving(false);
    }
  };

  // =================================================
  // PERMISSION LOADING
  // =================================================

  if (permissionsLoading) {
    return (
      <div
        className="flex min-h-[500px] items-center justify-center font-poppins"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm"
            style={{ color: PRIMARY }}
          >
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p
            className="mt-4 text-sm font-bold"
            style={{ color: TEXT_PRIMARY }}
          >
            Checking permissions...
          </p>

          <p
            className="mt-1 text-[10px]"
            style={{ color: MUTED }}
          >
            Verifying footer access.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !footer) {
    return (
      <div
        className="flex min-h-[500px] items-center justify-center font-poppins"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm"
            style={{ color: PRIMARY }}
          >
            <FiRefreshCw
              size={23}
              className="animate-spin"
            />
          </div>

          <p
            className="mt-4 text-sm font-bold"
            style={{ color: TEXT_PRIMARY }}
          >
            Loading footer...
          </p>

          <p
            className="mt-1 text-[10px]"
            style={{ color: MUTED }}
          >
            Fetching current footer settings.
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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen p-4 font-poppins sm:p-5 lg:p-6"
      style={{ backgroundColor: PAGE_BG }}
    >
      {/* HEADER */}
      <motion.div
        variants={itemVariants}
        className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center"
      >
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: PRIMARY }}
            />

            <span
              className="text-[9px] font-bold uppercase tracking-[0.22em]"
              style={{ color: ACCENT }}
            >
              Website Configuration
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1
              className="text-[28px] font-bold tracking-tight sm:text-[32px]"
              style={{ color: TEXT_PRIMARY }}
            >
              Footer Management
            </h1>

            <span
              className="hidden rounded-full border bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-wide sm:inline-flex"
              style={{
                borderColor: "rgba(30,58,138,0.15)",
                color: PRIMARY,
              }}
            >
              Website Footer
            </span>
          </div>

          <p
            className="mt-1.5 max-w-2xl text-xs leading-5"
            style={{ color: TEXT_SECONDARY }}
          >
            Manage your website footer logo, social
            links, contact information and copyright
            content.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* VIEW PERMISSION = REFRESH */}
          <button
            type="button"
            onClick={() => fetchFooter(true)}
            disabled={loading || saving}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-xs font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderColor: "rgba(30,58,138,0.20)",
              color: PRIMARY,
            }}
          >
            <FiRefreshCw
              size={15}
              className={
                loading ? "animate-spin" : ""
              }
            />
            Refresh
          </button>

          {/* UPDATE PERMISSION */}
          {canUpdateFooter ? (
            <button
              type="submit"
              form="footer-management-form"
              disabled={saving}
              className="flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.55)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY}, ${DARK_PRIMARY})`,
              }}
            >
              {saving ? (
                <FiRefreshCw
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <FiSave size={15} />
              )}

              {saving
                ? "Updating..."
                : "Update Footer"}
            </button>
          ) : (
            <div
              className="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-xs font-bold"
              style={{
                borderColor:
                  "rgba(30,58,138,0.15)",
                color: MUTED,
              }}
            >
              <FiCheck size={14} />
              View Only
            </div>
          )}
        </div>
      </motion.div>

      {/* FORM */}
      <form
        id="footer-management-form"
        onSubmit={handleSubmit}
      >
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 gap-5 xl:grid-cols-3"
        >
          {/* LEFT COLUMN */}
          <div className="space-y-5 xl:col-span-2">
            {/* BRANDING */}
            <SectionCard
              title="Footer Branding"
              subtitle="Update the footer logo and main footer title."
              icon={<FiImage size={18} />}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
                <LogoUploader
                  currentLogo={getInitialLogo(
                    footer
                  )}
                  selectedFile={form.logo}
                  disabled={!canUpdateFooter}
                  onChange={(file) =>
                    setForm((current) => ({
                      ...current,
                      logo: file,
                    }))
                  }
                />

                <div className="space-y-4">
                  <FooterField
                    label="Footer Title"
                    value={form.title}
                    disabled={!canUpdateFooter}
                    placeholder="Connect India through opportunity and..."
                    icon={<FiEdit3 size={13} />}
                    onChange={(value) =>
                      updateField(
                        "title",
                        value
                      )
                    }
                  />

                  <div
                    className="rounded-xl border p-3"
                    style={{
                      borderColor:
                        "rgba(30,58,138,0.10)",
                      backgroundColor: PAGE_BG,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FiCheck
                        size={14}
                        style={{ color: PRIMARY }}
                      />

                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.12em]"
                        style={{
                          color: PRIMARY,
                        }}
                      >
                        Footer Status
                      </span>
                    </div>

                    <p
                      className="mt-1 text-[10px] leading-4"
                      style={{
                        color: TEXT_SECONDARY,
                      }}
                    >
                      Footer content is available on
                      the website and can be updated
                      from this page.
                    </p>
                  </div>

                  {!canUpdateFooter && (
                    <div
                      className="rounded-xl border px-3 py-2.5"
                      style={{
                        borderColor:
                          "rgba(30,58,138,0.10)",
                        backgroundColor: "#EEF3FA",
                      }}
                    >
                      <p
                        className="text-[10px] font-semibold"
                        style={{
                          color: TEXT_SECONDARY,
                        }}
                      >
                        You have view access only.
                        Footer update permission is
                        required to edit these fields.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* SOCIAL LINKS */}
            <SectionCard
              title="Social Media Links"
              subtitle="Manage all social media URLs shown in the footer."
              icon={<FiLink size={18} />}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FooterField
                  label="Instagram"
                  value={form.instagram}
                  disabled={!canUpdateFooter}
                  placeholder="https://instagram.com/..."
                  icon={<FiInstagram size={13} />}
                  onChange={(value) =>
                    updateField(
                      "instagram",
                      value
                    )
                  }
                />

                <FooterField
                  label="Facebook"
                  value={form.facebook}
                  disabled={!canUpdateFooter}
                  placeholder="https://facebook.com/..."
                  icon={<FiGlobe size={13} />}
                  onChange={(value) =>
                    updateField(
                      "facebook",
                      value
                    )
                  }
                />

                <FooterField
                  label="LinkedIn"
                  value={form.linkedin}
                  disabled={!canUpdateFooter}
                  placeholder="https://linkedin.com/..."
                  icon={<FiLink size={13} />}
                  onChange={(value) =>
                    updateField(
                      "linkedin",
                      value
                    )
                  }
                />

                <FooterField
                  label="Twitter / X"
                  value={form.twitter}
                  disabled={!canUpdateFooter}
                  placeholder="https://x.com/..."
                  icon={<FiTwitter size={13} />}
                  onChange={(value) =>
                    updateField(
                      "twitter",
                      value
                    )
                  }
                />

                <FooterField
                  label="YouTube"
                  value={form.youtube}
                  disabled={!canUpdateFooter}
                  placeholder="https://youtube.com/..."
                  icon={<FiYoutube size={13} />}
                  onChange={(value) =>
                    updateField(
                      "youtube",
                      value
                    )
                  }
                />
              </div>
            </SectionCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            {/* CONTACT */}
            <SectionCard
              title="Contact Information"
              subtitle="Footer contact details visible to users."
              icon={<FiMail size={18} />}
            >
              <div className="space-y-4">
                <FooterField
                  label="Email"
                  value={form.email}
                  disabled={!canUpdateFooter}
                  placeholder="support@example.com"
                  icon={<FiMail size={13} />}
                  onChange={(value) =>
                    updateField(
                      "email",
                      value
                    )
                  }
                />

                <FooterField
                  label="Phone"
                  value={form.phone}
                  disabled={!canUpdateFooter}
                  placeholder="+91 98765 43210"
                  icon={<FiPhone size={13} />}
                  onChange={(value) =>
                    updateField(
                      "phone",
                      value
                    )
                  }
                />
              </div>
            </SectionCard>

            {/* COPYRIGHT */}
            <SectionCard
              title="Copyright"
              subtitle="Website footer copyright text."
              icon={<FiCheck size={18} />}
            >
              <FooterField
                label="Copyright Text"
                value={form.copyright}
                disabled={!canUpdateFooter}
                placeholder="© 2026 IndieConnect. All rights reserved."
                multiline
                rows={4}
                onChange={(value) =>
                  updateField(
                    "copyright",
                    value
                  )
                }
              />
            </SectionCard>

            {/* UPDATE INFO */}
            <div
              className="rounded-[18px] border p-4"
              style={{
                borderColor:
                  "rgba(30,58,138,0.15)",
                background: `linear-gradient(135deg, ${LIGHT_BLUE}, ${SOFT_BLUE})`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm"
                  style={{ color: PRIMARY }}
                >
                  {canUpdateFooter ? (
                    <FiUploadCloud size={16} />
                  ) : (
                    <FiCheck size={16} />
                  )}
                </div>

                <div>
                  <p
                    className="text-xs font-bold"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    {canUpdateFooter
                      ? "Ready to update"
                      : "View only mode"}
                  </p>

                  <p
                    className="mt-1 text-[10px] leading-5"
                    style={{ color: TEXT_SECONDARY }}
                  >
                    {canUpdateFooter ? (
                      <>
                        Make your changes and click
                        <span
                          className="font-bold"
                          style={{ color: PRIMARY }}
                        >
                          {" "}
                          Update Footer
                        </span>
                        . Logo is optional, so the
                        existing logo remains unchanged
                        when no new file is selected.
                      </>
                    ) : (
                      <>
                        You can view all current footer
                        settings, but an update permission
                        is required to make changes.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER PREVIEW */}
            <SectionCard
              title="Footer Preview"
              subtitle="Quick preview of your current footer branding."
              icon={<FiEyeIcon />}
            >
              <div
                className="overflow-hidden rounded-[16px] border"
                style={{
                  borderColor:
                    "rgba(30,58,138,0.10)",
                  backgroundColor: DARK_PRIMARY,
                }}
              >
                <div className="border-b border-white/10 px-4 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
                      {form.logo ? (
                        <LogoPreviewFile
                          file={form.logo}
                        />
                      ) : footer?.logo_url ? (
                        <img
                          src={footer.logo_url}
                          alt="Footer logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <FiImage
                          size={20}
                          style={{ color: "#6EA0FF" }}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">
                        {form.title ||
                          "Footer Title"}
                      </p>

                      <p className="mt-1 text-[9px] text-[#8FB2FF]">
                        Footer Branding
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 px-4 py-4">
                  {form.email && (
                    <div className="flex items-center gap-2 text-[10px] text-[#EAF1FF]">
                      <FiMail
                        size={12}
                        className="text-[#8FB2FF]"
                      />

                      <span className="truncate">
                        {form.email}
                      </span>
                    </div>
                  )}

                  {form.phone && (
                    <div className="flex items-center gap-2 text-[10px] text-[#EAF1FF]">
                      <FiPhone
                        size={12}
                        className="text-[#8FB2FF]"
                      />

                      <span>{form.phone}</span>
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-3 text-[9px] text-[#AAB7D2]">
                    {form.copyright ||
                      "Copyright © 2026. All rights reserved."}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </motion.div>
      </form>

      <div className="h-5" />
    </motion.div>
  );
};

export default FooterManagement;