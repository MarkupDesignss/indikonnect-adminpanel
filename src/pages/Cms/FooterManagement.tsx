
import React, {
  ChangeEvent,
  useEffect,
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
      staggerChildren: 0.05,
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

const valueOrEmpty = (
  value?: string | null
): string => {
  return value || "";
};

const getInitialLogo = (
  footer: FooterData | null
): string | null => {
  return footer?.logo_url || null;
};

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
  onChange: (value: string) => void;
}

const FooterField: React.FC<FieldProps> = ({
  label,
  value,
  placeholder,
  icon,
  multiline = false,
  rows = 4,
  onChange,
}) => {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#786f60]">
        {icon && (
          <span className="text-[#b8902e]">
            {icon}
          </span>
        )}

        {label}
      </label>

      {multiline ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="w-full resize-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 py-3 text-sm text-[#29251f] outline-none transition placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#29251f] outline-none transition placeholder:text-[#aaa08e] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/10"
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
      className="relative overflow-hidden rounded-[20px] border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)]"
    >
      <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

      <div className="flex items-center gap-3 border-b border-[#b8902e]/10 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#29251f]">
            {title}
          </h2>

          <p className="mt-0.5 text-[10px] text-[#a19583]">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="p-5">
        {children}
      </div>
    </motion.div>
  );
};

// =====================================================
// LOGO UPLOADER
// =====================================================

interface LogoUploaderProps {
  currentLogo: string | null;
  selectedFile: File | null;
  onChange: (file: File | null) => void;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({
  currentLogo,
  selectedFile,
  onChange,
}) => {
  const [preview, setPreview] =
    useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }

    const objectUrl =
      URL.createObjectURL(selectedFile);

    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const image =
    preview || currentLogo;

  return (
    <div className="rounded-[16px] border border-[#b8902e]/12 bg-[#fbfaf7] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#b8902e] shadow-sm">
            <FiImage size={14} />
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#a89a7d]">
              Footer Logo
            </p>

            <p className="text-[10px] font-bold text-[#403a30]">
              Current Footer Logo
            </p>
          </div>
        </div>

        {selectedFile && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[10px] font-bold text-[#b46055] hover:text-[#923e35]"
          >
            Remove
          </button>
        )}
      </div>

      <div className="flex h-[100px] items-center justify-center overflow-hidden rounded-lg border border-[#b8902e]/10 bg-white p-3">
        {image ? (
          <img
            src={image}
            alt="Footer Logo"
            className="max-h-[80px] max-w-full object-contain"
          />
        ) : (
          <div className="text-center text-[#aaa08e]">
            <FiImage
              size={24}
              className="mx-auto"
            />

            <p className="mt-1 text-[9px]">
              No footer logo available
            </p>
          </div>
        )}
      </div>

      <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#b8902e]/20 bg-white px-3 py-2 text-[9px] font-bold text-[#8f6d1d] transition hover:bg-[#faf8f3]">
        <FiUploadCloud size={13} />

        {selectedFile
          ? "Change Logo"
          : "Choose New Logo"}

        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={(
            event: ChangeEvent<HTMLInputElement>
          ) => {
            onChange(
              event.target.files?.[0] || null
            );

            event.target.value = "";
          }}
        />
      </label>

      {selectedFile && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#f7f1df] px-3 py-1.5 text-[8px] font-semibold text-[#8f6d1d]">
          <FiCheck size={11} />
          {selectedFile.name}
        </div>
      )}
    </div>
  );
};

// =====================================================
// MAIN PAGE
// =====================================================

const FooterManagement: React.FC =
  () => {
    const [footer, setFooter] =
      useState<FooterData | null>(null);

    const [form, setForm] =
      useState<FooterForm>({
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

    const [loading, setLoading] =
      useState(false);

    const [saving, setSaving] =
      useState(false);

    // =================================================
    // GET FOOTER
    // =================================================

    const fetchFooter = async () => {
      try {
        setLoading(true);

        const response =
          await footerApi.get();

        console.log(
          "Footer API Response:",
          response
        );

        /*
         * API RESPONSE:
         *
         * response.data
         *   -> success
         *   -> data
         *        -> heritage_sites
         *        -> footer
         *
         * So actual footer object is:
         *
         * response.data.data.footer
         */

        if (response?.data?.success) {
          const footerData =
            response?.data?.data?.footer;

          if (!footerData) {
            toast.error(
              "Footer data not found."
            );
            return;
          }

          console.log(
            "Footer Data:",
            footerData
          );

          // Save complete footer object
          setFooter(footerData);

          // Prefill all fields
          setForm({
            title:
              valueOrEmpty(
                footerData.title
              ),

            instagram:
              valueOrEmpty(
                footerData.instagram
              ),

            facebook:
              valueOrEmpty(
                footerData.facebook
              ),

            linkedin:
              valueOrEmpty(
                footerData.linkedin
              ),

            twitter:
              valueOrEmpty(
                footerData.twitter
              ),

            youtube:
              valueOrEmpty(
                footerData.youtube
              ),

            email:
              valueOrEmpty(
                footerData.email
              ),

            phone:
              valueOrEmpty(
                footerData.phone
              ),

            copyright:
              valueOrEmpty(
                footerData.copyright
              ),

            // Important:
            // Existing API logo is NOT a File.
            // It will be displayed through logo_url.
            logo: null,
          });
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
          error?.response?.data
            ?.message ||
            "Unable to load footer."
        );
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchFooter();
    }, []);

    // =================================================
    // FIELD UPDATE
    // =================================================

    const updateField = (
      field: keyof FooterForm,
      value: string
    ) => {
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

      if (!form.title.trim()) {
        toast.error(
          "Footer title is required."
        );
        return;
      }

      if (!form.email.trim()) {
        toast.error(
          "Footer email is required."
        );
        return;
      }

      if (!form.phone.trim()) {
        toast.error(
          "Footer phone is required."
        );
        return;
      }

      try {
        setSaving(true);

        const payload:
          FooterUpdatePayload = {
          logo: form.logo,

          title:
            form.title.trim(),

          instagram:
            form.instagram.trim(),

          facebook:
            form.facebook.trim(),

          linkedin:
            form.linkedin.trim(),

          twitter:
            form.twitter.trim(),

          youtube:
            form.youtube.trim(),

          email:
            form.email.trim(),

          phone:
            form.phone.trim(),

          copyright:
            form.copyright.trim(),
        };

        console.log(
          "Footer Update Payload:",
          payload
        );

        const response =
          await footerApi.update(
            payload
          );

        if (
          response?.data?.success
        ) {
          toast.success(
            response.data.message ||
              "Footer updated successfully."
          );

          await fetchFooter();
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
          error?.response?.data
            ?.message ||
            "Unable to update footer."
        );
      } finally {
        setSaving(false);
      }
    };

    // =================================================
    // LOADING
    // =================================================

    if (
      loading &&
      !footer
    ) {
      return (
        <div className="flex min-h-[500px] items-center justify-center bg-[#f7f5ef]">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#b8902e] shadow-sm">
              <FiRefreshCw
                size={23}
                className="animate-spin"
              />
            </div>

            <p className="mt-4 text-sm font-bold text-[#29251f]">
              Loading footer...
            </p>

            <p className="mt-1 text-[10px] text-[#a19583]">
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
        className="min-h-screen bg-[#f7f5ef] p-4 sm:p-5 lg:p-6"
      >
        {/* HEADER */}

        <motion.div
          variants={itemVariants}
          className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center"
        >
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#9a741b]">
                Website Configuration
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#29251f] sm:text-[32px]">
                Footer Management
              </h1>

              <span className="hidden rounded-full border border-[#b8902e]/15 bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-[#8f6d1d] sm:inline-flex">
                Website Footer
              </span>
            </div>

            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#8d8372]">
              Manage your website footer logo,
              social links, contact information
              and copyright content.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchFooter}
              disabled={
                loading || saving
              }
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-xs font-bold text-[#8f6d1d] shadow-sm transition hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                size={15}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="submit"
              form="footer-management-form"
              disabled={saving}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-5 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a98227] hover:to-[#7e6017] disabled:cursor-not-allowed disabled:opacity-50"
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
                icon={
                  <FiImage size={18} />
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
                  <LogoUploader
                    currentLogo={getInitialLogo(
                      footer
                    )}
                    selectedFile={
                      form.logo
                    }
                    onChange={(file) =>
                      setForm(
                        (current) => ({
                          ...current,
                          logo: file,
                        })
                      )
                    }
                  />

                  <div className="space-y-4">
                    <FooterField
                      label="Footer Title"
                      value={form.title}
                      placeholder="Connect India through opportunity and..."
                      icon={
                        <FiEdit3
                          size={13}
                        />
                      }
                      onChange={(value) =>
                        updateField(
                          "title",
                          value
                        )
                      }
                    />

                    <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                      <div className="flex items-center gap-2">
                        <FiCheck
                          size={14}
                          className="text-[#b8902e]"
                        />

                        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8f6d1d]">
                          Footer Status
                        </span>
                      </div>

                      <p className="mt-1 text-[10px] leading-4 text-[#786f60]">
                        Footer content is available on
                        the website and can be updated
                        from this page.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* SOCIAL LINKS */}

              <SectionCard
                title="Social Media Links"
                subtitle="Manage all social media URLs shown in the footer."
                icon={
                  <FiLink size={18} />
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FooterField
                    label="Instagram"
                    value={
                      form.instagram
                    }
                    placeholder="https://instagram.com/..."
                    icon={
                      <FiInstagram
                        size={13}
                      />
                    }
                    onChange={(value) =>
                      updateField(
                        "instagram",
                        value
                      )
                    }
                  />

                  <FooterField
                    label="Facebook"
                    value={
                      form.facebook
                    }
                    placeholder="https://facebook.com/..."
                    icon={
                      <FiGlobe
                        size={13}
                      />
                    }
                    onChange={(value) =>
                      updateField(
                        "facebook",
                        value
                      )
                    }
                  />

                  <FooterField
                    label="LinkedIn"
                    value={
                      form.linkedin
                    }
                    placeholder="https://linkedin.com/..."
                    icon={
                      <FiLink
                        size={13}
                      />
                    }
                    onChange={(value) =>
                      updateField(
                        "linkedin",
                        value
                      )
                    }
                  />

                  <FooterField
                    label="Twitter / X"
                    value={
                      form.twitter
                    }
                    placeholder="https://x.com/..."
                    icon={
                      <FiTwitter
                        size={13}
                      />
                    }
                    onChange={(value) =>
                      updateField(
                        "twitter",
                        value
                      )
                    }
                  />

                  <FooterField
                    label="YouTube"
                    value={
                      form.youtube
                    }
                    placeholder="https://youtube.com/..."
                    icon={
                      <FiYoutube
                        size={13}
                      />
                    }
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
                icon={
                  <FiMail size={18} />
                }
              >
                <div className="space-y-4">
                  <FooterField
                    label="Email"
                    value={form.email}
                    placeholder="support@example.com"
                    icon={
                      <FiMail
                        size={13}
                      />
                    }
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
                    placeholder="+91 98765 43210"
                    icon={
                      <FiPhone
                        size={13}
                      />
                    }
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
                icon={
                  <FiCheck size={18} />
                }
              >
                <FooterField
                  label="Copyright Text"
                  value={
                    form.copyright
                  }
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

              <div className="rounded-[18px] border border-[#b8902e]/15 bg-gradient-to-br from-[#fffaf0] to-[#faf8f3] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#b8902e] shadow-sm">
                    <FiUploadCloud
                      size={16}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[#29251f]">
                      Ready to update
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-[#8d8372]">
                      Make your changes and click
                      <span className="font-bold text-[#8f6d1d]">
                        {" "}
                        Update Footer
                      </span>
                      . Logo is optional, so the
                      existing logo remains unchanged
                      when no new file is selected.
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER PREVIEW */}

              <SectionCard
                title="Footer Preview"
                subtitle="Quick preview of your current footer branding."
                icon={
                  <FiEyeIcon />
                }
              >
                <div className="overflow-hidden rounded-[16px] border border-[#b8902e]/10 bg-[#2f2a22]">
                  <div className="border-b border-white/10 px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-lg bg-white p-2">
                        {form.logo ? (
                          <LogoPreviewFile
                            file={form.logo}
                          />
                        ) : footer?.logo_url ? (
                          <img
                            src={
                              footer.logo_url
                            }
                            alt="Footer logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <FiImage
                            size={20}
                            className="text-[#b8902e]"
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white">
                          {form.title ||
                            "Footer Title"}
                        </p>

                        <p className="mt-1 text-[9px] text-[#bdaf96]">
                          Footer Branding
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 px-4 py-4">
                    {form.email && (
                      <div className="flex items-center gap-2 text-[10px] text-[#ddd5c6]">
                        <FiMail
                          size={12}
                          className="text-[#d4af52]"
                        />

                        <span className="truncate">
                          {form.email}
                        </span>
                      </div>
                    )}

                    {form.phone && (
                      <div className="flex items-center gap-2 text-[10px] text-[#ddd5c6]">
                        <FiPhone
                          size={12}
                          className="text-[#d4af52]"
                        />

                        <span>
                          {form.phone}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-white/10 pt-3 text-[9px] text-[#9f9686]">
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

// =====================================================
// LOGO FILE PREVIEW
// =====================================================

const LogoPreviewFile: React.FC<{
  file: File;
}> = ({ file }) => {
  const [preview, setPreview] =
    useState<string | null>(null);

  useEffect(() => {
    const objectUrl =
      URL.createObjectURL(file);

    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!preview) {
    return null;
  }

  return (
    <img
      src={preview}
      alt="Preview"
      className="max-h-full max-w-full object-contain"
    />
  );
};

// =====================================================
// SMALL EYE ICON
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

export default FooterManagement;

