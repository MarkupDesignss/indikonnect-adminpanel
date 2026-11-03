
import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiCheck,
  FiEdit3,
  FiGlobe,
  FiImage,
  FiInstagram,
  FiLink,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiTrash2,
  FiTwitter,
  FiUploadCloud,
  FiX,
  FiYoutube,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import footerApi, {
  FooterData,
  FooterUpdatePayload,
  HeritageSite,
  HeritageSitePayload,
} from "../../api/endpoints/footer";

import { usePermissions } from "../../pages/permissions/usePermissions";
import logoApi from "../../api/endpoints/logoApi";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

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

const HERITAGE_UPDATE_PERMISSION_KEYS = [
  "heritage-sites.create",
  "heritage_sites.create",
  "heritage-site.create",
  "HeritageSites.create",
  "heritage-sites.update",
  "heritage_sites.update",
  "heritage-site.update",
  "HeritageSites.update",
  "heritage-sites.edit",
  "heritage_sites.edit",
  "heritage-sites.delete",
  "heritage_sites.delete",
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
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 15,
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

type FooterTextField = Exclude<keyof FooterForm, "logo">;

interface HeritageSiteForm {
  title: string;
  subtitle: string;
  image: File | null;
}

const EMPTY_HERITAGE_FORM: HeritageSiteForm = {
  title: "",
  subtitle: "",
  image: null,
};

const valueOrEmpty = (value?: string | null): string => value || "";

const getInitialLogo = (footer: FooterData | null): string | null =>
  footer?.logo_url || null;

const formatDate = (value?: string | null): string => {
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
// COMMON FIELD
// =====================================================

interface FieldProps {
  label: string;
  value: string;
  placeholder?: string;
  icon?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
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
  required = false,
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

        {required && <span className="text-[#C23B32]">*</span>}
      </label>

      {multiline ? (
        <textarea
          value={value}
          rows={rows}
          disabled={disabled}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${baseClass} resize-none px-4 py-3`}
        />
      ) : (
        <input
          type="text"
          value={value}
          disabled={disabled}
          required={required}
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

    return () => URL.revokeObjectURL(objectUrl);
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

    return () => URL.revokeObjectURL(objectUrl);
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
// HERITAGE SITE ADD / EDIT MODAL
// ONLY THREE FIELDS:
// 1. IMAGE
// 2. TITLE
// 3. SUBTITLE
// =====================================================

interface HeritageSiteEditorProps {
  site: HeritageSite | null;
  saving: boolean;
  onClose: () => void;
  onSave: (form: HeritageSiteForm) => void;
}

const HeritageSiteEditor: React.FC<HeritageSiteEditorProps> = ({
  site,
  saving,
  onClose,
  onSave,
}) => {
  const isEdit = Boolean(site);

  const [form, setForm] = useState<HeritageSiteForm>({
    title: site?.title || EMPTY_HERITAGE_FORM.title,
    subtitle: site?.subtitle || EMPTY_HERITAGE_FORM.subtitle,
    image: null,
  });

  const [preview, setPreview] = useState<string | null>(
    site?.image_url || null
  );

  // ---------------------------------------------------
  // IMAGE PREVIEW
  // ---------------------------------------------------

  useEffect(() => {
    if (!form.image) {
      setPreview(site?.image_url || null);
      return;
    }

    const objectUrl = URL.createObjectURL(form.image);

    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [form.image, site?.image_url]);

  // ---------------------------------------------------
  // UPDATE FORM
  // ---------------------------------------------------

  const updateForm = (
    field: keyof HeritageSiteForm,
    value: string | File | null
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const fieldClass =
    "h-11 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] px-3.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10";

  const labelClass =
    "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]";

  // ---------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Heritage site title is required.");
      return;
    }

    if (!isEdit && !form.image) {
      toast.error("Please select a heritage site image.");
      return;
    }

    onSave({
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      image: form.image,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#0B1228]/60 p-3 backdrop-blur-[3px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="my-auto w-full max-w-2xl overflow-hidden rounded-[20px] border border-[#DCE6F2] bg-white shadow-2xl"
      >
        {/* MODAL HEADER */}

        <div className="flex items-center justify-between border-b border-[#DCE6F2] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
              {isEdit ? <FiEdit3 size={18} /> : <FiPlus size={20} />}
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#111827]">
                {isEdit ? "Edit Heritage Site" : "Add Heritage Site"}
              </h2>

              <p className="mt-0.5 text-[10px] text-[#6B7280]">
                {isEdit
                  ? `Update the details of ${site?.title}`
                  : "Add a new heritage site to your website"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DCE6F2] text-[#6B7280] transition hover:bg-[#F4F8FD] hover:text-[#111827] disabled:opacity-50"
          >
            <FiX size={17} />
          </button>
        </div>

        {/* MODAL FORM */}

        <form id="heritage-site-form" onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">

            {/* IMAGE */}

            <div>
              <label className={labelClass}>
                Heritage Site Image
                {!isEdit && <span className="text-[#C23B32]"> *</span>}
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
                <div className="flex h-[135px] items-center justify-center overflow-hidden rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-3">
                  {preview ? (
                    <img
                      src={preview}
                      alt={site?.title || form.title || "Heritage Site"}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-[#9CA3AF]">
                      <FiImage size={28} />
                      <span className="mt-2 text-[9px]">
                        No image selected
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center rounded-xl border border-dashed border-[#BFD3F0] bg-white p-4">
                  <div className="flex items-center gap-2 text-[#2D6FE8]">
                    <FiUploadCloud size={17} />

                    <span className="text-xs font-bold">
                      Upload Site Image
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] leading-5 text-[#6B7280]">
                    PNG, JPG, JPEG or WEBP.
                    {isEdit
                      ? " Leave empty to keep the existing image."
                      : " Select an image for the new site."}
                  </p>

                  <label className="mt-3 inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-[#2D6FE8]/20 bg-[#EAF3FF] px-3 py-2 text-[10px] font-bold text-[#2D6FE8] transition hover:bg-[#DCEBFF]">
                    <FiImage size={13} />

                    {form.image ? "Change Image" : "Choose Image"}

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        updateForm(
                          "image",
                          event.target.files?.[0] || null
                        );

                        event.target.value = "";
                      }}
                    />
                  </label>

                  {form.image && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="truncate text-[9px] font-semibold text-[#2D6FE8]">
                        {form.image.name}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateForm("image", null)}
                        className="shrink-0 text-[9px] font-bold text-[#C23B32]"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TITLE */}

            <div>
              <label className={labelClass}>
                Title <span className="text-[#C23B32]">*</span>
              </label>

              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  updateForm("title", event.target.value)
                }
                placeholder="e.g. MSME"
                className={fieldClass}
                required
              />
            </div>

            {/* SUBTITLE */}

            <div>
              <label className={labelClass}>Subtitle</label>

              <input
                type="text"
                value={form.subtitle}
                onChange={(event) =>
                  updateForm("subtitle", event.target.value)
                }
                placeholder="e.g. Govt. of India"
                className={fieldClass}
              />
            </div>

            {/* SITE ID */}

            {isEdit && (
              <div className="rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] px-3.5 py-3">
                <p className="text-[10px] font-semibold text-[#6B7280]">
                  Site ID:{" "}
                  <span className="text-[#111827]">
                    #{site?.id}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* MODAL FOOTER */}

          <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#DCE6F2] bg-white px-5 py-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 rounded-xl border border-[#DCE6F2] bg-white px-5 text-xs font-bold text-[#6B7280] transition hover:bg-[#F4F8FD] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="heritage-site-form"
              disabled={saving}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-5 text-xs font-bold text-white transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <FiRefreshCw size={14} className="animate-spin" />
              ) : isEdit ? (
                <FiSave size={14} />
              ) : (
                <FiPlus size={15} />
              )}

              {saving
                ? isEdit
                  ? "Updating..."
                  : "Adding..."
                : isEdit
                  ? "Save Changes"
                  : "Add Heritage Site"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
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
    [isSuperAdmin, hasModuleAccess, hasPermission]
  );

  const canUpdateFooter = useMemo(
    () => isSuperAdmin || hasAnyPermission(UPDATE_PERMISSION_KEYS),
    [isSuperAdmin, hasPermission]
  );

  const canManageHeritageSites = useMemo(
    () =>
      isSuperAdmin ||
      canUpdateFooter ||
      hasAnyPermission(HERITAGE_UPDATE_PERMISSION_KEYS),
    [isSuperAdmin, canUpdateFooter, hasPermission]
  );

  // =================================================
  // LOGO STATE
  // =================================================

  const [logoUrl, setLogoUrl] = useState<string | null>(
    DEFAULT_LOGO_URL
  );

  const [logoLoading, setLogoLoading] = useState(true);

  // =================================================
  // FOOTER STATES
  // =================================================

  const [footer, setFooter] = useState<FooterData | null>(null);

  const [heritageSites, setHeritageSites] = useState<HeritageSite[]>([]);

  const [initialFooterLoading, setInitialFooterLoading] = useState(true);

  const [loading, setLoading] = useState(false);

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

  const [saving, setSaving] = useState(false);

  // =================================================
  // HERITAGE STATES
  // =================================================

  const [isHeritageEditorOpen, setIsHeritageEditorOpen] = useState(false);

  const [editingSite, setEditingSite] = useState<HeritageSite | null>(null);

  const [siteSaving, setSiteSaving] = useState(false);

  const [siteToDelete, setSiteToDelete] = useState<HeritageSite | null>(null);

  const [deletingSiteId, setDeletingSiteId] = useState<number | null>(null);

  // =================================================
  // FETCH REFS
  // =================================================

  const fetchInFlightRef = useRef<Promise<void> | null>(null);

  const hasInitialFetchRef = useRef(false);

  // =================================================
  // LOGO FETCH
  // =================================================

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

  // =================================================
  // GET FOOTER + HERITAGE SITES
  // =================================================

  const fetchFooter = async (
    force = false,
    isInitialLoad = false
  ) => {
    if (!canViewFooter) return;

    if (fetchInFlightRef.current) {
      return fetchInFlightRef.current;
    }

    if (!force && hasInitialFetchRef.current) return;

    const requestPromise = (async () => {
      try {
        setLoading(true);

        const response = await footerApi.get();

        if (response?.data?.success) {
          const responseData = response?.data?.data;

          // HERITAGE SITES

          const heritageData = responseData?.heritage_sites?.data;

          setHeritageSites(
            Array.isArray(heritageData) ? heritageData : []
          );

          // FOOTER DATA

          const footerData = responseData?.footer;

          if (footerData) {
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
          } else {
            toast.error("Footer data not found.");
          }

          hasInitialFetchRef.current = true;
        } else {
          toast.error(
            response?.data?.message || "Unable to load footer."
          );
        }
      } catch (error: any) {
        console.error("Fetch footer error:", error);

        toast.error(
          error?.response?.data?.message || "Unable to load footer."
        );
      } finally {
        setLoading(false);

        if (isInitialLoad) {
          setInitialFooterLoading(false);
        }
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
    if (permissionsLoading) return;

    if (canViewFooter && !hasInitialFetchRef.current) {
      void fetchFooter(false, true);
    } else if (!canViewFooter) {
      setLoading(false);
      setInitialFooterLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoading, canViewFooter]);

  // =================================================
  // INITIAL LOADING
  // =================================================

  const pageLoading =
    permissionsLoading || logoLoading || initialFooterLoading;

  // =================================================
  // FOOTER FIELD UPDATE
  // =================================================

  const updateField = (field: FooterTextField, value: string) => {
    if (!canUpdateFooter) return;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // =================================================
  // UPDATE FOOTER
  // =================================================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
        quote1: valueOrEmpty(footer?.quote1),
        quote2: valueOrEmpty(footer?.quote2),
        quote3: valueOrEmpty(footer?.quote3),
        copyright: form.copyright.trim(),
      };

      const response = await footerApi.update(payload);

      if (response?.data?.success) {
        toast.success(
          response.data.message || "Footer updated successfully."
        );

        await fetchFooter(true);
      } else {
        toast.error(
          response?.data?.message || "Unable to update footer."
        );
      }
    } catch (error: any) {
      console.error("Update footer error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to update footer."
      );
    } finally {
      setSaving(false);
    }
  };

  // =================================================
  // OPEN ADD MODAL
  // =================================================

  const handleAddHeritageSite = () => {
    if (!canManageHeritageSites) {
      toast.error("You do not have permission to add heritage sites.");
      return;
    }

    setEditingSite(null);
    setIsHeritageEditorOpen(true);
  };

  // =================================================
  // OPEN EDIT MODAL
  // =================================================

  const handleEditHeritageSite = (site: HeritageSite) => {
    if (!canManageHeritageSites) {
      toast.error("You do not have permission to edit heritage sites.");
      return;
    }

    setEditingSite(site);
    setIsHeritageEditorOpen(true);
  };

  // =================================================
  // CLOSE MODAL
  // =================================================

  const handleCloseHeritageEditor = () => {
    if (siteSaving) return;

    setIsHeritageEditorOpen(false);
    setEditingSite(null);
  };

  // =================================================
  // CREATE / UPDATE HERITAGE SITE
  // =================================================

  const handleSaveHeritageSite = async (
    values: HeritageSiteForm
  ) => {
    if (!canManageHeritageSites) {
      toast.error("You do not have permission to manage heritage sites.");
      return;
    }

    if (!values.title.trim()) {
      toast.error("Heritage site title is required.");
      return;
    }

    if (!editingSite && !values.image) {
      toast.error("Please select a heritage site image.");
      return;
    }

    try {
      setSiteSaving(true);

      // Only three fields are sent to the API.

      const payload: HeritageSitePayload = {
        title: values.title.trim(),
        subtitle: values.subtitle.trim(),
        image: values.image,
      };

      let response;

      // EDIT: PUT /api/heritage/{id}

      if (editingSite) {
        response = await footerApi.updateHeritageSite(
          editingSite.id,
          payload
        );
      }

      // ADD: POST /api/heritage

      else {
        response = await footerApi.createHeritageSite(payload);
      }

      if (response?.data?.success) {
        toast.success(
          response.data.message ||
            (editingSite
              ? "Heritage site updated successfully."
              : "Heritage site added successfully.")
        );

        setIsHeritageEditorOpen(false);
        setEditingSite(null);

        await fetchFooter(true);
      } else {
        toast.error(
          response?.data?.message ||
            (editingSite
              ? "Unable to update heritage site."
              : "Unable to add heritage site.")
        );
      }
    } catch (error: any) {
      console.error("Save heritage site error:", error);

      const validationErrors = error?.response?.data?.errors;

      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null;

      toast.error(
        (firstValidationError as string) ||
          error?.response?.data?.message ||
          (editingSite
            ? "Unable to update heritage site."
            : "Unable to add heritage site.")
      );
    } finally {
      setSiteSaving(false);
    }
  };

  // =================================================
  // DELETE HERITAGE SITE
  // =================================================

  const handleDeleteHeritageSite = async () => {
    if (!siteToDelete) return;

    if (!canManageHeritageSites) {
      toast.error("You do not have permission to delete heritage sites.");
      return;
    }

    const siteId = siteToDelete.id;

    try {
      setDeletingSiteId(siteId);

      const response = await footerApi.deleteHeritageSite(siteId);

      if (response?.data?.success) {
        toast.success(
          response.data.message || "Heritage site deleted successfully."
        );

        setHeritageSites((current) =>
          current.filter((site) => site.id !== siteId)
        );

        setSiteToDelete(null);
      } else {
        toast.error(
          response?.data?.message || "Unable to delete heritage site."
        );
      }
    } catch (error: any) {
      console.error("Delete heritage site error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to delete heritage site."
      );
    } finally {
      setDeletingSiteId(null);
    }
  };

  // =================================================
  // ACCESS DENIED
  // =================================================

  if (pageLoading) {
    return <PermissionLoadingState logoUrl={logoUrl} />;
  }

  if (!canViewFooter) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-[#F4F8FD] p-6 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#DCE6F2] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
            <FiAlertCircle size={26} />
          </div>

          <h2 className="mt-5 text-lg font-bold text-[#111827]">
            Access Denied
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            You do not have permission to view footer configuration.
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
            and heritage sites.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start">

          {/* REFRESH */}

          <button
            type="button"
            onClick={() => fetchFooter(true)}
            disabled={loading || saving || siteSaving}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-white px-4 text-sm font-bold text-[#2D6FE8] transition hover:border-[#4F8FF7]/40 hover:bg-[#EAF3FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {/* UPDATE FOOTER */}

          {canUpdateFooter ? (
            <button
              type="submit"
              form="footer-management-form"
              disabled={saving}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.7)] disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* ================================================= */}
      {/* FOOTER FORM */}
      {/* ================================================= */}

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
          </div>
        </motion.div>
      </form>

      {/* ================================================= */}
      {/* HERITAGE SITES SECTION */}
      {/* ================================================= */}

      <div className="mt-6">
        <SectionCard
          title="Heritage Sites"
          subtitle="Manage the heritage sites and recognition badges displayed on your website."
          icon={<FiMapPin size={18} />}
        >
          {/* HEADER + ADD BUTTON */}

          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                All Heritage Sites
              </h3>

              <p className="mt-1 text-[10px] text-[#6B7280]">
                View, add, edit and manage your website heritage site information.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start">


              {/* ADD BUTTON */}

              {canManageHeritageSites && (
                <button
                  type="button"
                  onClick={handleAddHeritageSite}
                  disabled={siteSaving || deletingSiteId !== null}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] px-4 text-[11px] font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(45,111,232,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiPlus size={15} />
                  Add Heritage Site
                </button>
              )}
            </div>
          </div>

          {/* HERITAGE SITE CARDS */}

          {heritageSites.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {heritageSites.map((site) => (
                <motion.div
                  key={site.id}
                  variants={itemVariants}
                  className="group overflow-hidden rounded-[16px] border border-[#DCE6F2] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#BFD3F0] hover:shadow-[0_10px_25px_rgba(45,111,232,0.08)]"
                >
                  {/* IMAGE */}

                  <div className="relative flex h-[180px] items-center justify-center overflow-hidden border-b border-[#DCE6F2] bg-[#F8FBFF] p-4">
                    {site.image_url ? (
                      <img
                        src={site.image_url}
                        alt={site.title || "Heritage Site"}
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#9CA3AF]">
                        <FiImage size={30} />

                        <span className="mt-2 text-[10px]">
                          No image available
                        </span>
                      </div>
                    )}

                    
                  </div>

                  {/* TITLE + SUBTITLE */}

                  <div className="p-4">
                    <div className="min-h-[55px]">
                      <h3 className="text-[15px] font-bold text-[#111827]">
                        {site.title || "Untitled Site"}
                      </h3>

                      <p className="mt-1 text-[11px] font-semibold text-[#2D6FE8]">
                        {site.subtitle || "No subtitle added"}
                      </p>
                    </div>

                
                    {/* EDIT + DELETE */}

                    {canManageHeritageSites ? (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditHeritageSite(site)}
                          disabled={Boolean(deletingSiteId) || siteSaving}
                          className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#2D6FE8]/20 bg-[#EAF3FF] text-[10px] font-bold text-[#2D6FE8] transition hover:bg-[#DCEBFF] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiEdit3 size={13} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setSiteToDelete(site)}
                          disabled={Boolean(deletingSiteId) || siteSaving}
                          className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#C23B32]/15 bg-[#FEF2F2] text-[10px] font-bold text-[#C23B32] transition hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiTrash2 size={13} />
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 flex h-9 items-center justify-center rounded-lg border border-[#DCE6F2] bg-[#F8FBFF] text-[10px] font-semibold text-[#6B7280]">
                        View Only
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* EMPTY STATE */

            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[#DCE6F2] bg-white px-4 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiImage size={25} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-[#111827]">
                No Heritage Sites Found
              </h3>

              <p className="mt-1 max-w-sm text-[10px] leading-5 text-[#6B7280]">
                Add your first heritage site using the Add Heritage Site button.
              </p>

              {canManageHeritageSites && (
                <button
                  type="button"
                  onClick={handleAddHeritageSite}
                  className="mt-4 flex h-9 items-center justify-center gap-2 rounded-lg bg-[#2D6FE8] px-4 text-[10px] font-bold text-white transition hover:bg-[#245CC4]"
                >
                  <FiPlus size={14} />
                  Add First Heritage Site
                </button>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ================================================= */}
      {/* ADD / EDIT HERITAGE MODAL */}
      {/* ================================================= */}

      {isHeritageEditorOpen && (
        <HeritageSiteEditor
          key={editingSite?.id ?? "new-heritage-site"}
          site={editingSite}
          saving={siteSaving}
          onClose={handleCloseHeritageEditor}
          onSave={handleSaveHeritageSite}
        />
      )}

      {/* ================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ================================================= */}

      {siteToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0B1228]/60 p-4 backdrop-blur-[3px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-[400px] rounded-[20px] border border-[#DCE6F2] bg-white p-6 shadow-2xl"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#C23B32]">
              <FiTrash2 size={24} />
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-base font-bold text-[#111827]">
                Delete Heritage Site?
              </h3>

              <p className="mt-2 text-xs leading-5 text-[#6B7280]">
                Are you sure you want to delete{" "}
                <span className="font-bold text-[#111827]">
                  {siteToDelete.title}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deletingSiteId !== null}
                onClick={() => setSiteToDelete(null)}
                className="flex h-10 flex-1 items-center justify-center rounded-xl border border-[#DCE6F2] bg-white text-xs font-bold text-[#6B7280] transition hover:bg-[#F4F8FD] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteHeritageSite}
                disabled={deletingSiteId !== null}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#C23B32] text-xs font-bold text-white transition hover:bg-[#A92F27] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingSiteId !== null ? (
                  <FiRefreshCw size={14} className="animate-spin" />
                ) : (
                  <FiTrash2 size={14} />
                )}

                {deletingSiteId !== null ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="h-5" />
    </motion.div>
  );
};

export default FooterManagement;
