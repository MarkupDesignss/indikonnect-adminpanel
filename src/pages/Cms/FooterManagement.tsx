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
// THEME — BLUE / YELLOW (matches Payment, Contents, Reels, FAQ)
// =====================================================
const PRIMARY = "#2D6FE8";
const DARK_PRIMARY = "#2D6FE8";
const BLUE = "#2D6FE8";
const ACCENT = "#4F8FF7";

const LIGHT_BLUE = "#EAF3FF";
const SOFT_BLUE = "#EAF3FF";
const PAGE_BG = "#F4F8FD";

const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#6B7280";
const MUTED = "#6B7280";

const BORDER = "#DCE6F2";

const WHITE = "#FFFFFF";

const DANGER = "#C23B32";
const DANGER_BG = "#FEF2F2";

const WARNING = "#FACC15";

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
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 110, damping: 15 },
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
  const baseClass =
    "w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10 disabled:cursor-not-allowed disabled:bg-[#EEF3FA] disabled:text-[#6B7280]";

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
        {icon && (
          <span className={disabled ? "text-[#6B7280]" : "text-[#2D6FE8]"}>
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
          className={`${baseClass} resize-none px-4 py-3`}
        />
      ) : (
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${baseClass} h-11 px-4`}
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
      className="relative overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]"
    >
      <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

      <div className="flex items-center gap-3 border-b border-[#DCE6F2] px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#111827]">{title}</h2>
          <p className="mt-0.5 text-[10px] text-[#6B7280]">{subtitle}</p>
        </div>
      </div>

      <div className="bg-[#F8FBFF] p-5">{children}</div>
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
    <div className="rounded-[16px] border border-[#DCE6F2] bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF3FF] text-[#2D6FE8]">
            <FiImage size={14} />
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
              Footer Logo
            </p>
            <p className="text-[10px] font-bold text-[#6B7280]">
              Current Footer Logo
            </p>
          </div>
        </div>

        {selectedFile && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[10px] font-bold text-[#C23B32] transition hover:opacity-80"
          >
            Remove
          </button>
        )}
      </div>

      <div className="flex h-[100px] items-center justify-center overflow-hidden rounded-lg border border-[#DCE6F2] bg-white p-3">
        {image ? (
          <img
            src={image}
            alt="Footer Logo"
            className="max-h-[80px] max-w-full object-contain"
          />
        ) : (
          <div className="text-center text-[#6B7280]">
            <FiImage size={24} className="mx-auto" />
            <p className="mt-1 text-[9px]">No footer logo available</p>
          </div>
        )}
      </div>

      {!disabled && (
        <>
          <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#2D6FE8]/20 bg-white px-3 py-2 text-[9px] font-bold text-[#2D6FE8] transition hover:bg-[#EAF3FF]">
            <FiUploadCloud size={13} />
            {selectedFile ? "Change Logo" : "Choose New Logo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                onChange(event.target.files?.[0] || null);
                event.target.value = "";
              }}
            />
          </label>

          {selectedFile && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#EAF3FF] px-3 py-1.5 text-[8px] font-semibold text-[#2D6FE8]">
              <FiCheck size={11} />
              {selectedFile.name}
            </div>
          )}
        </>
      )}

      {disabled && (
        <div className="mt-2 rounded-lg bg-[#EEF3FA] px-3 py-2 text-[9px] font-semibold text-[#6B7280]">
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
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canUpdateFooter = useMemo(
    () => isSuperAdmin || hasAnyPermission(UPDATE_PERMISSION_KEYS),
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
  const fetchInFlightRef = useRef<Promise<void> | null>(null);
  const hasInitialFetchRef = useRef(false);

  // =================================================
  // GET FOOTER
  // =================================================
  const fetchFooter = async (force = false) => {
    if (!canViewFooter) return;
    if (fetchInFlightRef.current) return fetchInFlightRef.current;
    if (!force && hasInitialFetchRef.current) return;

    const requestPromise = (async () => {
      try {
        setLoading(true);

        const response = await footerApi.get();

        if (response?.data?.success) {
          const footerData = response?.data?.data?.footer;

          if (!footerData) {
            toast.error("Footer data not found.");
            return;
          }

          setFooter(footerData);

          setForm({
            title: valueOrEmpty(footerData.title),
            instagram: valueOrEmpty(footerData.instagram),
            facebook: valueOrEmpty(footerData.facebook),
            linkedin: valueOrEmpty(footerData.linkedin),
            twitter: valueOrEmpty(footerData.twitter),
            youtube: valueOrEmpty(footerData.youtube),
            email: valueOrEmpty(footerData.email),
            phone: valueOrEmpty(footerData.phone),
            copyright: valueOrEmpty(footerData.copyright),
            logo: null,
          });

          hasInitialFetchRef.current = true;
        } else {
          toast.error(
            response?.data?.message || "Unable to load footer.",
          );
        }
      } catch (error: any) {
        console.error("Fetch footer error:", error);
        toast.error(
          error?.response?.data?.message || "Unable to load footer.",
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
  }, [permissionsLoading, canViewFooter]);

  // =================================================
  // FIELD UPDATE
  // =================================================
  const updateField = (field: keyof FooterForm, value: string) => {
    if (!canUpdateFooter) return;
    setForm((current) => ({ ...current, [field]: value }));
  };

  // =================================================
  // UPDATE FOOTER
  // =================================================
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canUpdateFooter) {
      toast.error("You do not have permission to update the footer.");
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

      const response = await footerApi.update(payload);

      if (response?.data?.success) {
        toast.success(
          response.data.message || "Footer updated successfully.",
        );
        await fetchFooter(true);
      } else {
        toast.error(
          response?.data?.message || "Unable to update footer.",
        );
      }
    } catch (error: any) {
      console.error("Update footer error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to update footer.",
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
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
            <FiRefreshCw size={27} className="animate-spin" />
          </div>
          <p className="mt-4 text-sm font-bold text-[#111827]">
            Checking permissions...
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            Verifying footer access.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !footer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] font-poppins">
        <div className="flex flex-col items-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#DCE6F2] border-t-[#2D6FE8]" />
          <p className="mt-3 text-sm text-[#6B7280]">Loading footer...</p>
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
      className="min-h-screen bg-white p-4 font-poppins sm:p-5 lg:p-7"
    >
      {/* HEADER */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center"
      >
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2D6FE8]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#4F8FF7]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D6FE8]">
              Website Configuration
            </span>
          </div>

          <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
            Footer Management
          </h1>

          <p className="mt-0.5 text-sm text-[#111827]">
            Manage your website footer logo, social links, contact information
            and copyright content.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start">
          {/* REFRESH */}
          <button
            type="button"
            onClick={() => fetchFooter(true)}
            disabled={loading || saving}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-white px-4 text-sm font-bold text-[#2D6FE8] transition hover:border-[#4F8FF7]/40 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {/* SAVE */}
          {canUpdateFooter ? (
            <button
              type="submit"
              form="footer-management-form"
              disabled={saving}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 text-sm font-bold text-white  transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <FiRefreshCw size={15} className="animate-spin" />
              ) : (
                <FiSave size={15} />
              )}
              {saving ? "Updating..." : "Update Footer"}
            </button>
          ) : (
            <div className="flex h-11 items-center gap-2 rounded-xl border border-[#DCE6F2] bg-white px-4 text-sm font-bold text-[#6B7280]">
              <FiCheck size={15} />
              View Only
            </div>
          )}
        </div>
      </motion.div>

      {/* FORM */}
      <form id="footer-management-form" onSubmit={handleSubmit}>
        <motion.div
          variants={containerVariants}
          className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3"
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
                  currentLogo={getInitialLogo(footer)}
                  selectedFile={form.logo}
                  disabled={!canUpdateFooter}
                  onChange={(file) =>
                    setForm((current) => ({ ...current, logo: file }))
                  }
                />

                <div className="space-y-4">
                  <FooterField
                    label="Footer Title"
                    value={form.title}
                    disabled={!canUpdateFooter}
                    placeholder="Connect India through opportunity and..."
                    icon={<FiEdit3 size={13} />}
                    onChange={(value) => updateField("title", value)}
                  />

                  <div className="rounded-xl border border-[#DCE6F2] bg-white p-3">
                    <div className="flex items-center gap-2">
                      <FiCheck size={14} className="text-[#2D6FE8]" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#2D6FE8]">
                        Footer Status
                      </span>
                    </div>

                    <p className="mt-1 text-[10px] leading-4 text-[#6B7280]">
                      Footer content is available on the website and can be
                      updated from this page.
                    </p>
                  </div>

                  {!canUpdateFooter && (
                    <div className="rounded-xl border border-[#DCE6F2] bg-[#EEF3FA] px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-[#6B7280]">
                        You have view access only. Footer update permission is
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
                  onChange={(value) => updateField("instagram", value)}
                />

                <FooterField
                  label="Facebook"
                  value={form.facebook}
                  disabled={!canUpdateFooter}
                  placeholder="https://facebook.com/..."
                  icon={<FiGlobe size={13} />}
                  onChange={(value) => updateField("facebook", value)}
                />

                <FooterField
                  label="LinkedIn"
                  value={form.linkedin}
                  disabled={!canUpdateFooter}
                  placeholder="https://linkedin.com/..."
                  icon={<FiLink size={13} />}
                  onChange={(value) => updateField("linkedin", value)}
                />

                <FooterField
                  label="Twitter / X"
                  value={form.twitter}
                  disabled={!canUpdateFooter}
                  placeholder="https://x.com/..."
                  icon={<FiTwitter size={13} />}
                  onChange={(value) => updateField("twitter", value)}
                />

                <FooterField
                  label="YouTube"
                  value={form.youtube}
                  disabled={!canUpdateFooter}
                  placeholder="https://youtube.com/..."
                  icon={<FiYoutube size={13} />}
                  onChange={(value) => updateField("youtube", value)}
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
                  onChange={(value) => updateField("email", value)}
                />

                <FooterField
                  label="Phone"
                  value={form.phone}
                  disabled={!canUpdateFooter}
                  placeholder="+91 98765 43210"
                  icon={<FiPhone size={13} />}
                  onChange={(value) => updateField("phone", value)}
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
                onChange={(value) => updateField("copyright", value)}
              />
            </SectionCard>

            {/* UPDATE INFO */}
            <div className="rounded-[18px] border border-[#2D6FE8]/15 bg-gradient-to-br from-[#EAF3FF] to-[#EAF3FF] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#2D6FE8] shadow-sm">
                  {canUpdateFooter ? (
                    <FiUploadCloud size={16} />
                  ) : (
                    <FiCheck size={16} />
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-[#111827]">
                    {canUpdateFooter ? "Ready to update" : "View only mode"}
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-[#6B7280]">
                    {canUpdateFooter ? (
                      <>
                        Make your changes and click
                        <span className="font-bold text-[#2D6FE8]">
                          {" "}
                          Update Footer
                        </span>
                        . Logo is optional, so the existing logo remains
                        unchanged when no new file is selected.
                      </>
                    ) : (
                      <>
                        You can view all current footer settings, but an update
                        permission is required to make changes.
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
              <div className="overflow-hidden rounded-[16px] border border-[#DCE6F2] bg-[#0B1228]">
                <div className="border-b border-white/10 px-4 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
                      {form.logo ? (
                        <LogoPreviewFile file={form.logo} />
                      ) : footer?.logo_url ? (
                        <img
                          src={footer.logo_url}
                          alt="Footer logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <FiImage size={20} className="text-[#4F8FF7]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">
                        {form.title || "Footer Title"}
                      </p>
                      <p className="mt-1 text-[9px] text-[#8FB2FF]">
                        Footer Branding
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 px-4 py-4">
                  {form.email && (
                    <div className="flex items-center gap-2 text-[10px] text-[#EAF3FF]">
                      <FiMail size={12} className="text-[#8FB2FF]" />
                      <span className="truncate">{form.email}</span>
                    </div>
                  )}

                  {form.phone && (
                    <div className="flex items-center gap-2 text-[10px] text-[#EAF3FF]">
                      <FiPhone size={12} className="text-[#8FB2FF]" />
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