import React, { ChangeEvent, FC, useEffect, useRef, useState } from "react";

import {
  FiCamera,
  FiCheck,
  FiMail,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiUpload,
  FiUser,
  FiX,
} from "react-icons/fi";

import { motion } from "framer-motion";
import toast from "react-hot-toast";

import adminApi from "../../api/endpoints/Auth";
import GlobalModal from "@/components/common/GlobalModal";

// =====================================================
// TYPES
// =====================================================

interface ProfileForm {
  name: string;
  email: string;
}

interface Permission {
  id: number;
  name: string;
  slug: string;
  module: string;
  action: string;
}

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  permissions: Permission[];
}

interface ProfileApiData {
  id?: number;
  name?: string;
  email?: string;

  profile_image?: string;
  profile_image_url?: string;

  profile_picture?: string;
  profile_picture_url?: string;
  avatar?: string;

  roles?: Role[];

  created_at?: string | null;
  updated_at?: string | null;
}

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
  hidden: { opacity: 0, y: 14 },
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
// SELF-CONTAINED ANIMATION STYLES
// =====================================================

const LocalStyles = () => (
  <style>{`
        @keyframes up-ambient-float {
            0%, 100% { transform: translate(-50%, 0) scale(1); opacity: 0.05; }
            50%      { transform: translate(-50%, -12px) scale(1.08); opacity: 0.09; }
        }
        @keyframes up-shimmer-sweep {
            0%   { transform: translateX(-150%) rotate(20deg); }
            100% { transform: translateX(250%) rotate(20deg); }
        }
        @keyframes up-avatar-glow {
            0%, 100% {
                box-shadow:
                    0 12px 30px -10px rgba(22,63,32,0.35),
                    inset 0 1px 0 rgba(255,255,255,0.25);
            }
            50% {
                box-shadow:
                    0 18px 40px -10px rgba(22,63,32,0.50),
                    inset 0 1px 0 rgba(255,255,255,0.35);
            }
        }
        .up-ambient { animation: up-ambient-float 8s ease-in-out infinite; }
        .up-shimmer { animation: up-shimmer-sweep 4s ease-in-out infinite; }
        .up-avatar-glow { animation: up-avatar-glow 3.6s ease-in-out infinite; }
    `}</style>
);

// =====================================================
// INPUT CLASS
// =====================================================

const inputClass =
  "h-11 w-full rounded-xl border border-[#D8E2D8] bg-white px-4 text-sm text-[#202721] outline-none transition placeholder:text-[#9AA29C] focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15";

// =====================================================
// COMPONENT
// =====================================================

const UpdateProfile: FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<ProfileApiData | null>(null);

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>("");

  const profileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
  });

  // ===================================================
  // PROFILE IMAGE MODAL
  // ===================================================

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string>("");

  const handleImageClick = (imageUrl: string) => {
    if (imageUrl) {
      setModalImage(imageUrl);
      setIsImageModalOpen(true);
    }
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setModalImage("");
  };

  // ===================================================
  // GET ORIGINAL PROFILE IMAGE
  // ===================================================

  const getOriginalProfileImage = (admin: ProfileApiData | null): string => {
    return (
      admin?.profile_image_url ||
      admin?.profile_image ||
      admin?.profile_picture_url ||
      admin?.profile_picture ||
      admin?.avatar ||
      ""
    );
  };

  // ===================================================
  // GET PROFILE
  // ===================================================

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await adminApi.me();
      const responseData = response?.data || response;

      const admin =
        responseData?.data?.admin || responseData?.admin || responseData;

      if (!admin) {
        toast.error("Unable to fetch profile.");
        return;
      }

      setProfile(admin);

      setForm({
        name: admin?.name || "",
        email: admin?.email || "",
      });

      const imageUrl = getOriginalProfileImage(admin);
      setProfilePreview(imageUrl);
    } catch (error: any) {
      console.error("Fetch profile error:", error);
      toast.error(error?.response?.data?.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchProfile();
  }, []);

  // ===================================================
  // CLEANUP OBJECT URL
  // ===================================================

  useEffect(() => {
    return () => {
      if (profilePreview && profilePreview.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreview);
      }
    };
  }, [profilePreview]);

  // ===================================================
  // INPUT CHANGE
  // ===================================================

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ===================================================
  // PROFILE IMAGE CHANGE
  // ===================================================

  const handleProfilePicture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB.");
      e.target.value = "";
      return;
    }

    setProfilePicture(file);
    const previewUrl = URL.createObjectURL(file);
    setProfilePreview(previewUrl);
  };

  // ===================================================
  // REMOVE SELECTED PROFILE IMAGE
  // ===================================================

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);

    if (profileInputRef.current) {
      profileInputRef.current.value = "";
    }

    const originalImage = getOriginalProfileImage(profile);
    setProfilePreview(originalImage);

    toast.success("Selected image removed.");
  };

  // ===================================================
  // SUBMIT / UPDATE PROFILE
  // ===================================================

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        profile_image: profilePicture || null,
      };

      const response = await adminApi.updateProfile(payload);

      if (response?.data?.success === false) {
        toast.error(response?.data?.message || "Unable to update profile.");
        return;
      }

      toast.success(response?.data?.message || "Profile updated successfully.");

      setProfilePicture(null);

      if (profileInputRef.current) {
        profileInputRef.current.value = "";
      }

      await fetchProfile();
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to update profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // INITIALS
  // ===================================================

  const getInitials = (name?: string) => {
    if (!name?.trim()) return "AD";

    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  // ===================================================
  // RENDER ROLES
  // ===================================================

  const renderRoles = () => {
    if (!profile?.roles || profile.roles.length === 0) return null;

    return (
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {profile.roles.map((role) => (
          <div key={role.id} className="group relative">
            <span className="rounded-full border border-[#163F20]/20 bg-[#EAF3EA] px-3 py-1.5 text-[9px] font-bold text-[#163F20] transition hover:bg-[#163F20] hover:text-white hover:border-transparent">
              {role.name}
            </span>

            <div className="invisible absolute left-1/2 top-full z-20 mt-2 w-48 -translate-x-1/2 rounded-xl border border-[#163F20]/15 bg-white p-3 shadow-[0_18px_40px_-12px_rgba(22,63,32,0.25)] group-hover:visible">
              <p className="text-[10px] font-bold text-[#202721]">
                {role.name}
              </p>

              <p className="mt-0.5 text-[9px] text-[#89918B]">
                {role.description}
              </p>

              {role.permissions && role.permissions.length > 0 && (
                <div className="mt-2 border-t border-[#163F20]/10 pt-2">
                  <p className="text-[8px] font-bold uppercase tracking-wide text-[#59645C]">
                    Permissions: {role.permissions.length}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ===================================================
  // RENDER PERMISSIONS
  // ===================================================

  const renderPermissions = () => {
    if (!profile?.roles) return null;

    const allPermissions: Permission[] = [];

    profile.roles.forEach((role) => {
      if (role.permissions) {
        allPermissions.push(...role.permissions);
      }
    });

    if (allPermissions.length === 0) return null;

    const groupedPermissions = allPermissions.reduce(
      (acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
      },
      {} as Record<string, Permission[]>,
    );

    return (
      <div className="mt-4 border-t border-[#163F20]/10 pt-4">
        <p className="text-[8px] font-bold uppercase tracking-wide text-[#59645C]">
          Permissions
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(groupedPermissions).map(([module, perms]) => (
            <span
              key={module}
              className="rounded-md bg-[#EAF3EA] px-2 py-1 text-[8px] font-semibold text-[#163F20]"
            >
              {module}: {perms.length}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <>
        <LocalStyles />

        <div className="flex min-h-[450px] items-center justify-center bg-[#F5F7F5]">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4C8A57] to-[#163F20] text-white shadow-[0_14px_30px_-10px_rgba(22,63,32,0.55)]">
              <FiRefreshCw size={22} className="animate-spin" />
            </div>

            <p className="mt-4 text-sm font-bold text-[#202721]">
              Loading profile...
            </p>

            <p className="mt-1 text-xs text-[#9AA29C]">
              Please wait while your profile is being loaded.
            </p>
          </div>
        </div>
      </>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <>
      <LocalStyles />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative min-h-screen bg-[#F5F7F5] p-4 sm:p-5 lg:p-7"
      >
        {/* =================================================
                    AMBIENT BACKGROUND
                ================================================= */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="up-ambient absolute -top-32 left-1/2 h-72 w-72 rounded-full bg-[#163F20] blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#4C8A57] opacity-[0.05] blur-3xl" />
        </div>

        {/* =================================================
                    HEADER
                ================================================= */}

        <motion.div
          variants={itemVariants}
          className="relative mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center"
        >
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#59645C]">
                Account Settings
              </span>
            </div>

            <h1 className="text-[30px] font-bold tracking-tight text-[#202721] sm:text-[34px]">
              Update Profile
            </h1>

            <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#89918B]">
              Manage your administrator profile and account information.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchProfile}
            disabled={loading || saving}
            className="
                            group
                            flex h-11 items-center justify-center gap-2
                            rounded-xl border border-[#163F20]/20
                            bg-white px-4 text-sm font-bold text-[#163F20]
                            shadow-[0_4px_12px_-4px_rgba(22,63,32,0.10),inset_0_1px_0_rgba(255,255,255,0.95)]
                            transition-all duration-300
                            hover:border-transparent
                            hover:from-[#4C8A57] hover:to-[#163F20] hover:text-white
                            hover:bg-gradient-to-br
                            hover:-translate-y-0.5
                            hover:shadow-[0_10px_22px_-8px_rgba(22,63,32,0.45)]
                            disabled:cursor-not-allowed disabled:opacity-50
                        "
          >
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </motion.div>

        {/* =================================================
                    MAIN GRID
                ================================================= */}

        <div className="relative grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* =================================================
                        PROFILE CARD (3D)
                    ================================================= */}

          <motion.div
            variants={itemVariants}
            className="
                            relative h-fit overflow-hidden rounded-[22px]
                            border border-[#E5EAE5]
                            bg-gradient-to-b from-white to-[#F5F7F5]
                            shadow-[0_18px_50px_-20px_rgba(22,63,32,0.22)]
                        "
          >
            {/* Top accent */}
            <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

            {/* Shimmer overlay */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="up-shimmer absolute -top-1/2 left-0 h-[200%] w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-40 blur-xl" />
            </div>

            <div className="relative p-5 text-center">
              {/* PROFILE IMAGE */}
              <div className="relative mx-auto w-fit">
                <div
                  onClick={() =>
                    profilePreview && handleImageClick(profilePreview)
                  }
                  className={`
                                        up-avatar-glow
                                        flex h-28 w-28 items-center justify-center
                                        overflow-hidden rounded-[28px]
                                        border-4 border-white
                                        bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219]
                                        text-3xl font-bold text-white
                                        transition-all duration-300
                                        ${
                                          profilePreview
                                            ? "cursor-pointer hover:scale-105"
                                            : "cursor-default"
                                        }
                                    `}
                >
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(form.name)
                  )}
                </div>

                {/* CAMERA BUTTON */}
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  disabled={saving}
                  className="
                                        absolute -bottom-1 -right-1
                                        flex h-9 w-9 items-center justify-center
                                        rounded-xl border-2 border-white
                                        bg-gradient-to-br from-[#4C8A57] to-[#163F20]
                                        text-white
                                        shadow-[0_8px_18px_-6px_rgba(22,63,32,0.55)]
                                        transition-all duration-300
                                        hover:-translate-y-0.5
                                        hover:shadow-[0_12px_22px_-6px_rgba(22,63,32,0.65)]
                                        disabled:cursor-not-allowed disabled:opacity-60
                                    "
                >
                  <FiCamera size={15} />
                </button>

                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicture}
                  className="hidden"
                />
              </div>

              {/* NAME */}
              <h2 className="mt-5 text-[17px] font-bold text-[#202721]">
                {form.name || "Admin"}
              </h2>

              {/* EMAIL */}
              <p className="mt-1 break-all text-xs text-[#89918B]">
                {form.email || "—"}
              </p>

              {/* ROLE */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#163F20]" />

                <span className="text-[10px] font-bold uppercase tracking-wide text-[#4C8A57]">
                  {profile?.roles && profile.roles.length > 0
                    ? profile.roles[0].name
                    : "Administrator"}
                </span>
              </div>

              {renderRoles()}
              {renderPermissions()}
            </div>

            {/* =================================================
                            SECURITY BOX
                        ================================================= */}

            <div className="border-t border-[#163F20]/10 bg-[#F5F7F5]/70 p-4">
              <div className="rounded-xl border border-[#163F20]/10 bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                <div className="flex items-center gap-2">
                  <FiShield size={14} className="text-[#163F20]" />

                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#4C8A57]">
                    Profile Security
                  </span>
                </div>

                <p className="mt-2 text-[10px] leading-5 text-[#89918B]">
                  Keep your profile information updated to maintain accurate
                  account records.
                </p>
              </div>
            </div>
          </motion.div>

          {/* =================================================
                        FORM CARD (3D)
                    ================================================= */}

          <motion.div
            variants={itemVariants}
            className="
                            relative overflow-hidden rounded-[22px]
                            border border-[#E5EAE5]
                            bg-white
                            shadow-[0_18px_50px_-20px_rgba(22,63,32,0.22)]
                        "
          >
            {/* Top accent */}
            <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#4C8A57] via-[#163F20] to-[#0F3219]" />

            {/* FORM HEADER */}
            <div className="border-b border-[#163F20]/10 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#EAF3EA] to-[#D5E5D6] text-[#163F20] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                  <FiUser size={19} />
                </div>

                <div>
                  <h2 className="text-[17px] font-bold text-[#202721]">
                    Personal Information
                  </h2>

                  <p className="mt-0.5 text-xs text-[#9AA29C]">
                    Update the information associated with your account.
                  </p>
                </div>
              </div>
            </div>

            {/* FORM BODY */}
            <div className="bg-[#F5F7F5] p-5 sm:p-6">
              <div className="space-y-5">
                {/* NAME */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
                    Full Name *
                  </label>

                  <div className="relative">
                    <FiUser
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
                    />

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      disabled={saving}
                      className={`${inputClass} pl-10 disabled:cursor-not-allowed disabled:bg-[#EAF3EA]`}
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
                    Email *
                  </label>

                  <div className="relative">
                    <FiMail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
                    />

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      disabled={saving}
                      className={`${inputClass} pl-10 disabled:cursor-not-allowed disabled:bg-[#EAF3EA]`}
                    />
                  </div>
                </div>

                {/* PROFILE PICTURE */}
                <div className="rounded-2xl border border-[#163F20]/10 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FiCamera size={15} className="text-[#163F20]" />

                        <p className="text-xs font-bold text-[#202721]">
                          Profile Picture
                        </p>
                      </div>

                      <p className="mt-1 text-[10px] text-[#9AA29C]">
                        Upload a new profile image from your device.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => profileInputRef.current?.click()}
                      disabled={saving}
                      className="
                                                group flex h-10 items-center justify-center gap-2
                                                rounded-xl border border-[#163F20]/15
                                                bg-[#EAF3EA] px-4 text-xs font-bold text-[#163F20]
                                                transition-all duration-300
                                                hover:bg-gradient-to-br hover:from-[#4C8A57] hover:to-[#163F20]
                                                hover:text-white hover:border-transparent
                                                hover:-translate-y-0.5
                                                hover:shadow-[0_10px_22px_-8px_rgba(22,63,32,0.45)]
                                                disabled:cursor-not-allowed disabled:opacity-50
                                            "
                    >
                      <FiUpload size={14} />
                      Choose Image
                    </button>
                  </div>

                  {/* SELECTED FILE */}
                  {profilePicture && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#163F20]/10 bg-[#F5F7F5] px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <FiCheck
                          size={13}
                          className="shrink-0 text-[#163F20]"
                        />

                        <span className="truncate text-[10px] font-semibold text-[#59645C]">
                          {profilePicture.name}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        disabled={saving}
                        title="Remove selected image"
                        className="
                                                    flex h-7 w-7 shrink-0 items-center justify-center
                                                    rounded-lg border border-[#C23B32]/25
                                                    bg-white text-[#C23B32]
                                                    transition
                                                    hover:bg-[#FBEAEA]
                                                    hover:text-[#C23B32]
                                                    disabled:cursor-not-allowed disabled:opacity-50
                                                "
                      >
                        <FiX size={13} />
                      </button>
                    </div>
                  )}

                  <div className="mt-2">
                    <p className="text-[9px] text-[#9AA29C]">
                      Maximum file size: 5MB
                    </p>
                  </div>
                </div>

                {/* ROLE INFORMATION */}
                {profile?.roles && profile.roles.length > 0 && (
                  <div className="rounded-2xl border border-[#163F20]/10 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                    <p className="text-xs font-bold text-[#202721]">
                      Role Information
                    </p>

                    {profile.roles.map((role) => (
                      <div
                        key={role.id}
                        className="mt-2 rounded-lg bg-[#F5F7F5] p-2"
                      >
                        <p className="text-sm font-semibold text-[#202721]">
                          {role.name}
                        </p>

                        <p className="text-[10px] text-[#89918B]">
                          {role.description}
                        </p>

                        {role.permissions && role.permissions.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map((perm) => (
                              <span
                                key={perm.id}
                                className="rounded-md bg-[#EAF3EA] px-1.5 py-0.5 text-[8px] text-[#163F20]"
                              >
                                {perm.name}
                              </span>
                            ))}

                            {role.permissions.length > 3 && (
                              <span className="text-[8px] text-[#89918B]">
                                +{role.permissions.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end border-t border-[#163F20]/10 bg-white px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="
                                    group flex items-center gap-2
                                    rounded-xl
                                    bg-gradient-to-br from-[#4C8A57] via-[#163F20] to-[#0F3219]
                                    px-6 py-2.5 text-sm font-bold text-white
                                    shadow-[0_10px_22px_-8px_rgba(22,63,32,0.6),inset_0_1px_0_rgba(255,255,255,0.18)]
                                    transition-all duration-300
                                    hover:-translate-y-0.5
                                    hover:shadow-[0_14px_28px_-8px_rgba(22,63,32,0.7),inset_0_1px_0_rgba(255,255,255,0.28)]
                                    active:scale-[0.98]
                                    disabled:cursor-not-allowed disabled:opacity-50
                                "
              >
                {saving ? (
                  <FiRefreshCw size={15} className="animate-spin" />
                ) : (
                  <FiSave size={15} />
                )}

                {saving ? "Saving..." : "Update Profile"}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* =================================================
                IMAGE MODAL
            ================================================= */}

      <GlobalModal
        isOpen={isImageModalOpen}
        onClose={closeImageModal}
        title="Profile Image"
        size="lg"
        showCloseButton={true}
      >
        <div className="relative flex items-center justify-center p-4">
          <img
            src={modalImage}
            alt="Profile Preview"
            className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
          />

          <button
            onClick={closeImageModal}
            className="
                            absolute right-20 top-0 z-50
                            flex h-10 w-10 items-center justify-center
                            rounded-full bg-black/70 text-white
                            transition-all duration-300
                            hover:bg-black/90 hover:scale-105
                        "
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>
      </GlobalModal>
    </>
  );
};

export default UpdateProfile;
