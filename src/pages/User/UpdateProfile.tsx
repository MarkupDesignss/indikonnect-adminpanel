import React, {
    ChangeEvent,
    FC,
    useEffect,
    useRef,
    useState,
} from "react";

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

    // Backward compatibility
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
        y: 14,
    },
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
// INPUT CLASS
// =====================================================

const inputClass =
    "h-11 w-full rounded-xl border border-[#d8d0c0] bg-white px-4 text-sm text-[#2a2620] outline-none transition placeholder:text-[#afa592] focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10";

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

    const getOriginalProfileImage = (
        admin: ProfileApiData | null
    ): string => {
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

            /**
             * Supports:
             *
             * {
             *   admin: {...}
             * }
             *
             * OR
             *
             * {
             *   data: {
             *     admin: {...}
             *   }
             * }
             */

            const admin =
                responseData?.data?.admin ||
                responseData?.admin ||
                responseData;

            console.log("Extracted Admin:", admin);

            if (!admin) {
                toast.error("Unable to fetch profile.");
                return;
            }

            setProfile(admin);

            // -------------------------------------------------
            // FORM PREFILL
            // -------------------------------------------------

            setForm({
                name: admin?.name || "",
                email: admin?.email || "",
            });

            // -------------------------------------------------
            // PROFILE IMAGE
            // -------------------------------------------------

            const imageUrl = getOriginalProfileImage(admin);

            setProfilePreview(imageUrl);

            console.log("Profile Loaded:", {
                name: admin?.name || "",
                email: admin?.email || "",
                image: imageUrl,
            });
        } catch (error: any) {
            console.error("Fetch profile error:", error);

            toast.error(
                error?.response?.data?.message ||
                "Unable to load profile."
            );
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
            if (
                profilePreview &&
                profilePreview.startsWith("blob:")
            ) {
                URL.revokeObjectURL(profilePreview);
            }
        };
    }, [profilePreview]);

    // ===================================================
    // INPUT CHANGE
    // ===================================================

    const handleChange = (
        e: ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ===================================================
    // PROFILE IMAGE CHANGE
    // ===================================================

    const handleProfilePicture = (
        e: ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        // -------------------------------------------------
        // IMAGE TYPE VALIDATION
        // -------------------------------------------------

        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image.");

            e.target.value = "";

            return;
        }

        // -------------------------------------------------
        // FILE SIZE VALIDATION
        // -------------------------------------------------

        if (file.size > 5 * 1024 * 1024) {
            toast.error(
                "Image size should be less than 5MB."
            );

            e.target.value = "";

            return;
        }

        // -------------------------------------------------
        // SAVE FILE
        // -------------------------------------------------

        setProfilePicture(file);

        // -------------------------------------------------
        // PREVIEW
        // -------------------------------------------------

        const previewUrl = URL.createObjectURL(file);

        setProfilePreview(previewUrl);
    };

    // ===================================================
    // REMOVE / CUT SELECTED PROFILE IMAGE
    // ===================================================

    const handleRemoveProfilePicture = () => {
        // Remove selected file
        setProfilePicture(null);

        // Reset file input
        if (profileInputRef.current) {
            profileInputRef.current.value = "";
        }

        // Restore original API image
        const originalImage =
            getOriginalProfileImage(profile);

        setProfilePreview(originalImage);

        toast.success("Selected image removed.");
    };

    // ===================================================
    // SUBMIT / UPDATE PROFILE
    // ===================================================

    const handleSubmit = async () => {
        // -------------------------------------------------
        // NAME VALIDATION
        // -------------------------------------------------

        if (!form.name.trim()) {
            toast.error("Please enter your name.");
            return;
        }

        // -------------------------------------------------
        // EMAIL VALIDATION
        // -------------------------------------------------

        if (!form.email.trim()) {
            toast.error("Please enter your email.");
            return;
        }

        // -------------------------------------------------
        // EMAIL FORMAT
        // -------------------------------------------------

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(form.email.trim())) {
            toast.error(
                "Please enter a valid email address."
            );
            return;
        }

        try {
            setSaving(true);

            // =================================================
            // BUILD PAYLOAD
            // =================================================

            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                profile_image: profilePicture || null,
            };

            console.log(
                "Update Profile Payload:",
                payload
            );

            // =================================================
            // API CALL
            // POST /admin/update
            // FORM DATA
            // =================================================

            const response =
                await adminApi.updateProfile(payload);

            console.log(
                "Update Profile Response:",
                response?.data
            );

            // =================================================
            // RESPONSE HANDLING
            // =================================================

            if (response?.data?.success === false) {
                toast.error(
                    response?.data?.message ||
                    "Unable to update profile."
                );

                return;
            }

            // =================================================
            // SUCCESS
            // =================================================

            toast.success(
                response?.data?.message ||
                "Profile updated successfully."
            );

            // =================================================
            // RESET SELECTED FILE
            // =================================================

            setProfilePicture(null);

            if (profileInputRef.current) {
                profileInputRef.current.value = "";
            }

            // =================================================
            // FETCH LATEST PROFILE
            // =================================================

            await fetchProfile();
        } catch (error: any) {
            console.error(
                "Update profile error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to update profile."
            );
        } finally {
            setSaving(false);
        }
    };

    // ===================================================
    // INITIALS
    // ===================================================

    const getInitials = (name?: string) => {
        if (!name?.trim()) {
            return "AD";
        }

        const parts = name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 1) {
            return parts[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    };

    // ===================================================
    // RENDER ROLES
    // ===================================================

    const renderRoles = () => {
        if (
            !profile?.roles ||
            profile.roles.length === 0
        ) {
            return null;
        }

        return (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
                {profile.roles.map((role) => (
                    <div
                        key={role.id}
                        className="group relative"
                    >
                        <span className="rounded-full border border-[#b8902e]/15 bg-[#faf4df] px-3 py-1.5 text-[9px] font-bold text-[#806319] transition hover:bg-[#b8902e] hover:text-white">
                            {role.name}
                        </span>

                        {/* TOOLTIP */}

                        <div className="invisible absolute left-1/2 top-full z-20 mt-2 w-48 -translate-x-1/2 rounded-xl border border-[#b8902e]/20 bg-white p-3 shadow-lg group-hover:visible">
                            <p className="text-[10px] font-bold text-[#29251f]">
                                {role.name}
                            </p>

                            <p className="mt-0.5 text-[9px] text-[#8d8372]">
                                {role.description}
                            </p>

                            {role.permissions &&
                                role.permissions.length > 0 && (
                                    <div className="mt-2 border-t border-[#b8902e]/10 pt-2">
                                        <p className="text-[8px] font-bold uppercase tracking-wide text-[#786f60]">
                                            Permissions:{" "}
                                            {role.permissions.length}
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
        if (!profile?.roles) {
            return null;
        }

        const allPermissions: Permission[] = [];

        profile.roles.forEach((role) => {
            if (role.permissions) {
                allPermissions.push(...role.permissions);
            }
        });

        if (allPermissions.length === 0) {
            return null;
        }

        const groupedPermissions =
            allPermissions.reduce(
                (acc, perm) => {
                    if (!acc[perm.module]) {
                        acc[perm.module] = [];
                    }

                    acc[perm.module].push(perm);

                    return acc;
                },
                {} as Record<string, Permission[]>
            );

        return (
            <div className="mt-4 border-t border-[#b8902e]/10 pt-4">
                <p className="text-[8px] font-bold uppercase tracking-wide text-[#786f60]">
                    Permissions
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(
                        groupedPermissions
                    ).map(([module, perms]) => (
                        <span
                            key={module}
                            className="rounded-md bg-[#faf8f3] px-2 py-1 text-[8px] font-semibold text-[#806319]"
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
            <div className="flex min-h-[450px] items-center justify-center bg-[#faf8f3]">
                <div className="flex flex-col items-center text-center">
                    <FiRefreshCw
                        size={28}
                        className="animate-spin text-[#b8902e]"
                    />

                    <p className="mt-4 text-sm font-bold text-[#2a2620]">
                        Loading profile...
                    </p>

                    <p className="mt-1 text-xs text-[#a89a7d]">
                        Please wait while your profile is
                        being loaded.
                    </p>
                </div>
            </div>
        );
    }

    // ===================================================
    // UI
    // ===================================================

    return (
        <>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="min-h-screen bg-[#faf8f3] p-4 sm:p-5 lg:p-7"
            >
                {/* =================================================
              HEADER
          ================================================= */}

                <motion.div
                    variants={itemVariants}
                    className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center"
                >
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

                            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9a741b]">
                                Account Settings
                            </span>
                        </div>

                        <h1 className="font-serif text-[30px] font-bold tracking-tight text-[#29251f] sm:text-[34px]">
                            Update Profile
                        </h1>

                        <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#8d8372]">
                            Manage your administrator profile
                            and account information.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchProfile}
                        disabled={loading || saving}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 text-sm font-bold text-[#8f6d1d] shadow-sm transition hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <FiRefreshCw
                            size={16}
                            className={
                                loading ? "animate-spin" : ""
                            }
                        />

                        Refresh
                    </button>
                </motion.div>

                {/* =================================================
              MAIN GRID
          ================================================= */}

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
                    {/* =================================================
                PROFILE CARD
            ================================================= */}

                    <motion.div
                        variants={itemVariants}
                        className="relative h-fit overflow-hidden rounded-[22px] border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)]"
                    >
                        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

                        <div className="p-5 text-center">
                            {/* PROFILE IMAGE */}

                            <div className="relative mx-auto w-fit">
                                <div
                                    onClick={() =>
                                        profilePreview &&
                                        handleImageClick(
                                            profilePreview
                                        )
                                    }
                                    className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-[28px] border-4 border-[#faf4df] bg-gradient-to-br from-[#d4af52] to-[#9c761e] text-3xl font-bold text-white shadow-lg transition duration-200 ${profilePreview
                                            ? "cursor-pointer hover:scale-105 hover:shadow-xl"
                                            : "cursor-default"
                                        }`}
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
                                    onClick={() =>
                                        profileInputRef.current?.click()
                                    }
                                    disabled={saving}
                                    className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-[#b8902e] text-white shadow-md transition hover:bg-[#8f6d1d] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FiCamera size={15} />
                                </button>

                                {/* FILE INPUT */}

                                <input
                                    ref={profileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={
                                        handleProfilePicture
                                    }
                                    className="hidden"
                                />
                            </div>

                            {/* NAME */}

                            <h2 className="mt-5 text-[17px] font-bold text-[#29251f]">
                                {form.name || "Admin"}
                            </h2>

                            {/* EMAIL */}

                            <p className="mt-1 break-all text-xs text-[#8d8372]">
                                {form.email || "—"}
                            </p>

                            {/* ROLE */}

                            <div className="mt-4 flex items-center justify-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[#b8902e]" />

                                <span className="text-[10px] font-bold uppercase tracking-wide text-[#8f6d1d]">
                                    {profile?.roles &&
                                        profile.roles.length > 0
                                        ? profile.roles[0].name
                                        : "Administrator"}
                                </span>
                            </div>

                            {/* ROLES */}

                            {renderRoles()}

                            {/* PERMISSIONS */}

                            {renderPermissions()}
                        </div>

                        {/* =================================================
                  SECURITY
              ================================================= */}

                        <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] p-4">
                            <div className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3">
                                <div className="flex items-center gap-2">
                                    <FiShield
                                        size={14}
                                        className="text-[#b8902e]"
                                    />

                                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#8f6d1d]">
                                        Profile Security
                                    </span>
                                </div>

                                <p className="mt-2 text-[10px] leading-5 text-[#8d8372]">
                                    Keep your profile information
                                    updated to maintain accurate
                                    account records.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* =================================================
                FORM CARD
            ================================================= */}

                    <motion.div
                        variants={itemVariants}
                        className="relative overflow-hidden rounded-[22px] border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)]"
                    >
                        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

                        {/* FORM HEADER */}

                        <div className="border-b border-[#b8902e]/10 px-5 py-5 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                                    <FiUser size={19} />
                                </div>

                                <div>
                                    <h2 className="text-[17px] font-bold text-[#29251f]">
                                        Personal Information
                                    </h2>

                                    <p className="mt-0.5 text-xs text-[#a19583]">
                                        Update the information
                                        associated with your account.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* FORM BODY */}

                        <div className="bg-[#faf8f3] p-5 sm:p-6">
                            <div className="space-y-5">
                                {/* =================================================
                      NAME
                  ================================================= */}

                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                                        Full Name *
                                    </label>

                                    <div className="relative">
                                        <FiUser
                                            size={15}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8902e]"
                                        />

                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Enter your name"
                                            disabled={saving}
                                            className={`${inputClass} pl-10 disabled:cursor-not-allowed disabled:bg-gray-50`}
                                        />
                                    </div>
                                </div>

                                {/* =================================================
                      EMAIL
                  ================================================= */}

                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
                                        Email *
                                    </label>

                                    <div className="relative">
                                        <FiMail
                                            size={15}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8902e]"
                                        />

                                        <input
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="Enter your email"
                                            disabled={saving}
                                            className={`${inputClass} pl-10 disabled:cursor-not-allowed disabled:bg-gray-50`}
                                        />
                                    </div>
                                </div>

                                {/* =================================================
                      PROFILE PICTURE
                  ================================================= */}

                                <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <FiCamera
                                                    size={15}
                                                    className="text-[#b8902e]"
                                                />

                                                <p className="text-xs font-bold text-[#29251f]">
                                                    Profile Picture
                                                </p>
                                            </div>

                                            <p className="mt-1 text-[10px] text-[#a89a7d]">
                                                Upload a new profile image
                                                from your device.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                profileInputRef.current?.click()
                                            }
                                            disabled={saving}
                                            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] px-4 text-xs font-bold text-[#8f6d1d] transition hover:bg-[#faf4df] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <FiUpload size={14} />

                                            Choose Image
                                        </button>
                                    </div>

                                    {/* SELECTED FILE */}

                                    {profilePicture && (
                                        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] px-3 py-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <FiCheck
                                                    size={13}
                                                    className="shrink-0 text-[#b8902e]"
                                                />

                                                <span className="truncate text-[10px] font-semibold text-[#786f60]">
                                                    {profilePicture.name}
                                                </span>
                                            </div>

                                            {/* CUT / REMOVE BUTTON */}

                                            <button
                                                type="button"
                                                onClick={
                                                    handleRemoveProfilePicture
                                                }
                                                disabled={saving}
                                                title="Remove selected image"
                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <FiX size={13} />
                                            </button>
                                        </div>
                                    )}

                                    {/* IMAGE INFO */}

                                    <div className="mt-2">
                                        <p className="text-[9px] text-[#a89a7d]">
                                            Maximum file size: 5MB
                                        </p>
                                    </div>
                                </div>

                                {/* =================================================
                      ROLE INFORMATION
                  ================================================= */}

                                {profile?.roles &&
                                    profile.roles.length > 0 && (
                                        <div className="rounded-2xl border border-[#b8902e]/10 bg-white p-4">
                                            <p className="text-xs font-bold text-[#29251f]">
                                                Role Information
                                            </p>

                                            {profile.roles.map(
                                                (role) => (
                                                    <div
                                                        key={role.id}
                                                        className="mt-2 rounded-lg bg-[#faf8f3] p-2"
                                                    >
                                                        <p className="text-sm font-semibold text-[#29251f]">
                                                            {role.name}
                                                        </p>

                                                        <p className="text-[10px] text-[#8d8372]">
                                                            {role.description}
                                                        </p>

                                                        {role.permissions &&
                                                            role.permissions
                                                                .length > 0 && (
                                                                <div className="mt-1 flex flex-wrap gap-1">
                                                                    {role.permissions
                                                                        .slice(
                                                                            0,
                                                                            3
                                                                        )
                                                                        .map(
                                                                            (
                                                                                perm
                                                                            ) => (
                                                                                <span
                                                                                    key={
                                                                                        perm.id
                                                                                    }
                                                                                    className="rounded-md bg-[#faf4df] px-1.5 py-0.5 text-[8px] text-[#806319]"
                                                                                >
                                                                                    {
                                                                                        perm.name
                                                                                    }
                                                                                </span>
                                                                            )
                                                                        )}

                                                                    {role
                                                                        .permissions
                                                                        .length >
                                                                        3 && (
                                                                            <span className="text-[8px] text-[#8d8372]">
                                                                                +
                                                                                {role
                                                                                    .permissions
                                                                                    .length -
                                                                                    3}{" "}
                                                                                more
                                                                            </span>
                                                                        )}
                                                                </div>
                                                            )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                            </div>
                        </div>

                        {/* =================================================
                  FOOTER
              ================================================= */}

                        <div className="flex justify-end border-t border-[#b8902e]/10 bg-white px-5 py-4 sm:px-6">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-[#a8841c] hover:to-[#7c5d12] disabled:cursor-not-allowed disabled:opacity-50"
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
                                    ? "Saving..."
                                    : "Update Profile"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* =================================================
            IMAGE MODAL - Using GlobalModal
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
                        className="max-h-[80vh] max-w-full rounded-lg object-contain"
                    />

                    {/* CLOSE BUTTON - on top of image with high z-index */}
                    <button
                        onClick={closeImageModal}
                        className="absolute right-20 top-0 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black/90 hover:scale-105"
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