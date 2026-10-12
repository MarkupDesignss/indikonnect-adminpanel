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
// THEME — BLUE / YELLOW (matches Payment, Contents, Reels, FAQ, Footer, Admin)
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
// TYPES
// =====================================================
interface PasswordForm {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

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
    transition: { type: "spring" as const, stiffness: 110, damping: 15 },
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
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
        {label}
      </label>

      <div className="relative">
        <FiLock
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2D6FE8]"
        />

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-[#DCE6F2] bg-[#F4F8FD] pl-10 pr-11 text-sm text-[#111827] outline-none transition placeholder:text-[#6B7280] focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#2D6FE8]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-[#6B7280] transition hover:text-[#2D6FE8]"
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#F4F8FD] p-4 font-poppins sm:p-5 lg:p-7"
    >
      {/* PAGE HEADER */}
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
              Account Security
            </span>
          </div>

          <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
            Change Password
          </h1>

          <p className="mt-0.5 text-sm text-[#111827]">
            Update your account password and keep your administrator account
            secure.
          </p>
        </div>
      </motion.div>

      {/* MAIN GRID */}
      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,720px)_320px]">
        {/* FORM CARD */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]"
        >
          {/* Top accent */}
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#4F8FF7] via-[#2D6FE8] to-[#2D6FE8]" />

          {/* FORM HEADER */}
          <div className="relative border-b border-[#DCE6F2] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
                <FiLock size={19} />
              </div>

              <div>
                <h2 className="text-[17px] font-bold text-[#111827]">
                  Password Settings
                </h2>
                <p className="mt-0.5 text-xs text-[#6B7280]">
                  Enter your current password and choose a new secure password.
                </p>
              </div>
            </div>
          </div>

          {/* FORM BODY */}
          <div className="relative space-y-5 bg-[#F8FBFF] p-5 sm:p-6">
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
                className="overflow-hidden rounded-xl border border-[#DCE6F2] bg-white p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                    Password Strength
                  </span>

                  <span
                    className={`text-[10px] font-bold ${
                      passwordScore <= 2
                        ? "text-[#C23B32]"
                        : passwordScore <= 4
                          ? "text-[#A16207]"
                          : "text-[#2D6FE8]"
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
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        item <= passwordScore
                          ? passwordScore <= 2
                            ? "bg-[#C23B32]"
                            : passwordScore <= 4
                              ? "bg-[#FACC15]"
                              : "bg-[#2D6FE8]"
                          : "bg-[#EAF3FF]"
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
                        className={`flex h-5 w-5 items-center justify-center rounded-md transition-all duration-300 ${
                          valid
                            ? "bg-[#2D6FE8] text-white shadow-[0_2px_6px_-2px_rgba(45,111,232,0.45)]"
                            : "bg-[#EAF3FF] text-[#6B7280]"
                        }`}
                      >
                        <FiCheck size={11} />
                      </span>

                      <span
                        className={`text-[10px] font-bold ${
                          valid ? "text-[#2D6FE8]" : "text-[#6B7280]"
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
                className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-all duration-300 ${
                  form.new_password === form.new_password_confirmation
                    ? "border-[#2D6FE8]/25 bg-[#EAF3FF] text-[#2D6FE8]"
                    : "border-[#C23B32]/25 bg-[#FEF2F2] text-[#C23B32]"
                }`}
              >
                {form.new_password === form.new_password_confirmation
                  ? "✓ Passwords match."
                  : "Passwords do not match."}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="relative flex items-center justify-between gap-4 border-t border-[#DCE6F2] bg-[#F8FBFF] px-5 py-4 sm:px-6">
            <AnimatePresence>
              {apiMessage && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`text-sm font-bold ${
                    apiMessage.type === "success"
                      ? "text-[#2D6FE8]"
                      : "text-[#C23B32]"
                  }`}
                >
                  {apiMessage.text}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#4F8FF7] to-[#2D6FE8] px-6 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(45,111,232,0.7)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* SIDE INFO CARD */}
        <motion.div
          variants={itemVariants}
          className="relative h-fit overflow-hidden rounded-[22px] border border-[#DCE6F2] bg-white shadow-[0_8px_30px_rgba(45,111,232,0.06)]"
        >
          {/* Top accent */}
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8]" />

          <div className="p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#2D6FE8]">
              <FiShield size={19} />
            </div>

            <h3 className="mt-4 text-[16px] font-bold text-[#111827]">
              Account Security
            </h3>

            <p className="mt-1.5 text-xs leading-5 text-[#6B7280]">
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
                  className="flex items-start gap-2.5 rounded-xl border border-[#DCE6F2] bg-[#F8FBFF] p-3 transition hover:bg-[#EAF3FF]"
                >
                  <FiCheck size={14} className="mt-0.5 shrink-0 text-[#2D6FE8]" />

                  <span className="text-[11px] font-bold leading-4 text-[#6B7280]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ChangePassword;