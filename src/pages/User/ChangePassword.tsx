import React, { ChangeEvent, FC, useState, useEffect } from "react";
import {
  FiCheck,
  FiEye,
  FiEyeOff,
  FiLock,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import adminApi from "../../api/endpoints/Auth";

// =====================================================
// TYPES
// =====================================================

interface PasswordForm {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// =====================================================
// SELF-CONTAINED ANIMATION STYLES
// =====================================================

const LocalStyles = () => (
  <style>{`
    @keyframes cp-ambient-float {
      0%, 100% { transform: translate(-50%, 0) scale(1); opacity: 0.05; }
      50%      { transform: translate(-50%, -12px) scale(1.08); opacity: 0.09; }
    }
    @keyframes cp-shimmer-sweep {
      0%   { transform: translateX(-150%) rotate(20deg); }
      100% { transform: translateX(250%) rotate(20deg); }
    }
    .cp-ambient { animation: cp-ambient-float 8s ease-in-out infinite; }
    .cp-shimmer { animation: cp-shimmer-sweep 5s ease-in-out infinite; }
  `}</style>
);

// =====================================================
// ANIMATIONS
// =====================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 110, damping: 15 },
  },
};

// =====================================================
// PASSWORD FIELD
// =====================================================

interface PasswordFieldProps {
  label: string;
  value: string;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}

const PasswordField: FC<PasswordFieldProps> = ({
  label,
  value,
  placeholder,
  visible,
  onToggle,
  onChange,
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#59645C]">
        {label}
      </label>

      <div className="relative">
        <FiLock
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#163F20]"
        />

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            h-12 w-full rounded-xl
            border border-[#D8E2D8] bg-white
            pl-10 pr-11 text-sm text-[#202721]
            outline-none transition placeholder:text-[#9AA29C]
            focus:border-[#163F20] focus:ring-2 focus:ring-[#163F20]/15
          "
        />

        <button
          type="button"
          onClick={onToggle}
          className="
            absolute right-3 top-1/2 flex -translate-y-1/2
            items-center justify-center
            text-[#89918B] transition
            hover:text-[#163F20]
          "
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <FiEyeOff size={17} /> : <FiEye size={17} />}
        </button>
      </div>
    </div>
  );
};

// =====================================================
// MAIN
// =====================================================

const ChangePassword: FC = () => {
  const [form, setForm] = useState<PasswordForm>({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ===================================================
  // PASSWORD STRENGTH
  // ===================================================

  const passwordChecks = {
    length: form.new_password.length >= 8,
    upper: /[A-Z]/.test(form.new_password),
    lower: /[a-z]/.test(form.new_password),
    number: /\d/.test(form.new_password),
    special: /[^A-Za-z0-9]/.test(form.new_password),
  };

  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
  const isStrongPassword = passwordScore === 5;

  // ===================================================
  // API MESSAGE AUTO-CLEAR
  // ===================================================

  useEffect(() => {
    if (apiMessage) {
      const timer = setTimeout(() => {
        setApiMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [apiMessage]);

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async () => {
    if (!form.current_password) {
      setApiMessage({
        text: "Please enter your current password.",
        type: "error",
      });
      return;
    }

    if (!form.new_password) {
      setApiMessage({
        text: "Please enter your new password.",
        type: "error",
      });
      return;
    }

    if (form.new_password.length < 8) {
      setApiMessage({
        text: "New password must be at least 8 characters.",
        type: "error",
      });
      return;
    }

    if (form.new_password !== form.new_password_confirmation) {
      setApiMessage({
        text: "New password and confirmation do not match.",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await adminApi.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
        new_password_confirmation: form.new_password_confirmation,
      });

      if (response.data?.success !== false) {
        const successMsg =
          response.data?.message || "Password changed successfully.";
        setApiMessage({ text: successMsg, type: "success" });
        toast.success(successMsg);

        setForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
      } else {
        const errorMsg =
          response.data?.message || "Unable to change password.";
        setApiMessage({ text: errorMsg, type: "error" });
      }
    } catch (error: any) {
      console.error("Change password error:", error);

      const errorMsg =
        error?.response?.data?.message || "Unable to change password.";
      setApiMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // RENDER
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
          <div className="cp-ambient absolute -top-32 left-1/2 h-72 w-72 rounded-full bg-[#163F20] blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#4C8A57] opacity-[0.05] blur-3xl" />
        </div>

        {/* =================================================
            HEADER
        ================================================= */}

        <motion.div variants={itemVariants} className="relative mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#59645C]">
              Account Security
            </span>
          </div>

          <h1 className="text-[30px] font-bold tracking-tight text-[#202721] sm:text-[34px]">
            Change Password
          </h1>

          <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#89918B]">
            Update your account password and keep your administrator account
            secure.
          </p>
        </motion.div>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="relative grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,720px)_320px]">
          {/* =================================================
              FORM CARD
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

            {/* Shimmer sweep */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="cp-shimmer absolute -top-1/2 left-0 h-[200%] w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-30 blur-xl" />
            </div>

            {/* FORM HEADER */}
            <div className="relative border-b border-[#163F20]/10 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-11 w-11 items-center justify-center
                    rounded-xl
                    bg-gradient-to-br from-[#EAF3EA] to-[#D5E5D6]
                    text-[#163F20]
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]
                  "
                >
                  <FiLock size={19} />
                </div>

                <div>
                  <h2 className="text-[17px] font-bold text-[#202721]">
                    Password Settings
                  </h2>

                  <p className="mt-0.5 text-xs text-[#9AA29C]">
                    Enter your current password and choose a new secure
                    password.
                  </p>
                </div>
              </div>
            </div>

            {/* FORM BODY */}
            <div className="relative space-y-5 bg-[#F5F7F5] p-5 sm:p-6">
              <PasswordField
                label="Current Password *"
                value={form.current_password}
                visible={showCurrent}
                onToggle={() => setShowCurrent((prev) => !prev)}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    current_password: value,
                  }))
                }
                placeholder="Enter current password"
              />

              <PasswordField
                label="New Password *"
                value={form.new_password}
                visible={showNew}
                onToggle={() => setShowNew((prev) => !prev)}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    new_password: value,
                  }))
                }
                placeholder="Enter new password"
              />

              {/* STRENGTH — only when not strong */}
              {form.new_password && !isStrongPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-xl border border-[#163F20]/10 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#59645C]">
                      Password Strength
                    </span>

                    <span
                      className={`text-[10px] font-bold ${passwordScore <= 2
                          ? "text-[#C23B32]"
                          : passwordScore <= 4
                            ? "text-[#8A6D16]"
                            : "text-[#1F7A3D]"
                        }`}
                    >
                      {passwordScore <= 2
                        ? "Weak"
                        : passwordScore <= 4
                          ? "Good"
                          : "Strong"}
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div
                        key={item}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${item <= passwordScore
                            ? passwordScore <= 2
                              ? "bg-[#C23B32]"
                              : passwordScore <= 4
                                ? "bg-[#D9A900]"
                                : "bg-[#163F20]"
                            : "bg-[#EAF3EA]"
                          }`}
                      />
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {[
                      [passwordChecks.length, "At least 8 characters"],
                      [passwordChecks.upper, "One uppercase letter"],
                      [passwordChecks.lower, "One lowercase letter"],
                      [passwordChecks.number, "One number"],
                      [passwordChecks.special, "One special character"],
                    ].map(([valid, label]) => (
                      <div
                        key={String(label)}
                        className="flex items-center gap-2"
                      >
                        <span
                          className={`
                            flex h-5 w-5 items-center justify-center rounded-md
                            transition-all duration-300
                            ${valid
                              ? "bg-[#163F20] text-white shadow-[0_2px_6px_-2px_rgba(22,63,32,0.45)]"
                              : "bg-[#EAF3EA] text-[#9AA29C]"
                            }
                          `}
                        >
                          <FiCheck size={11} />
                        </span>

                        <span
                          className={`text-[10px] ${valid ? "text-[#163F20]" : "text-[#89918B]"
                            }`}
                        >
                          {String(label)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <PasswordField
                label="Confirm New Password *"
                value={form.new_password_confirmation}
                visible={showConfirm}
                onToggle={() => setShowConfirm((prev) => !prev)}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    new_password_confirmation: value,
                  }))
                }
                placeholder="Confirm new password"
              />

              {form.new_password_confirmation && (
                <div
                  className={`
                    rounded-xl border px-3 py-2.5 text-xs font-semibold
                    transition-all duration-300
                    ${form.new_password === form.new_password_confirmation
                      ? "border-[#163F20]/20 bg-[#EAF3EA] text-[#1F7A3D]"
                      : "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]"
                    }
                  `}
                >
                  {form.new_password === form.new_password_confirmation
                    ? "✓ Passwords match."
                    : "Passwords do not match."}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="relative flex items-center justify-between border-t border-[#163F20]/10 bg-white px-5 py-4 sm:px-6">
              {/* API Message Display */}
              <AnimatePresence>
                {apiMessage && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`
                      text-sm font-bold
                      ${apiMessage.type === "success"
                        ? "text-[#1F7A3D]"
                        : "text-[#C23B32]"
                      }
                    `}
                  >
                    {apiMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="
                  group ml-auto flex items-center gap-2
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
                {loading ? (
                  <FiRefreshCw size={15} className="animate-spin" />
                ) : (
                  <FiShield size={15} />
                )}
                {loading ? "Updating..." : "Change Password"}
              </button>
            </div>
          </motion.div>

          {/* =================================================
              SIDE INFO CARD
          ================================================= */}

          <motion.div
            variants={itemVariants}
            className="
              relative h-fit overflow-hidden rounded-[22px]
              border border-[#E5EAE5]
              bg-white
              shadow-[0_18px_50px_-20px_rgba(22,63,32,0.22)]
            "
          >
            {/* Top accent */}
            <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#4C8A57] to-[#0F3219]" />

            <div className="p-5">
              <div
                className="
                  flex h-11 w-11 items-center justify-center
                  rounded-xl
                  bg-gradient-to-br from-[#EAF3EA] to-[#D5E5D6]
                  text-[#163F20]
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]
                "
              >
                <FiShield size={19} />
              </div>

              <h3 className="mt-4 text-[16px] font-bold text-[#202721]">
                Account Security
              </h3>

              <p className="mt-1.5 text-xs leading-5 text-[#89918B]">
                Use a strong password that is difficult to guess and avoid
                reusing passwords.
              </p>

              <div className="mt-5 space-y-2.5">
                {[
                  "Use at least 8 characters",
                  "Mix uppercase and lowercase letters",
                  "Include numbers and special characters",
                  "Do not reuse an old password",
                ].map((item) => (
                  <div
                    key={item}
                    className="
                      flex items-start gap-2.5
                      rounded-xl
                      border border-[#163F20]/10
                      bg-[#F5F7F5]
                      p-3
                      transition
                      hover:bg-[#EAF3EA]
                    "
                  >
                    <FiCheck
                      size={14}
                      className="mt-0.5 shrink-0 text-[#163F20]"
                    />

                    <span className="text-[11px] leading-4 text-[#59645C]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default ChangePassword;