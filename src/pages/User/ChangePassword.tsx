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
// ANIMATIONS
// =====================================================

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
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
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#786f60]">
        {label}
      </label>

      <div className="relative">
        <FiLock
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8902e]"
        />

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-white pl-10 pr-11 text-sm text-[#2a2620] outline-none transition placeholder:text-[#afa592] focus:border-[#b8902e] focus:ring-2 focus:ring-[#b8902e]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-[#918572] transition hover:text-[#8f6d1d]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <FiEyeOff size={17} />
          ) : (
            <FiEye size={17} />
          )}
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
  const [apiMessage, setApiMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
      setApiMessage({ text: "Please enter your current password.", type: 'error' });
      return;
    }

    if (!form.new_password) {
      setApiMessage({ text: "Please enter your new password.", type: 'error' });
      return;
    }

    if (form.new_password.length < 8) {
      setApiMessage({ text: "New password must be at least 8 characters.", type: 'error' });
      return;
    }

    if (form.new_password !== form.new_password_confirmation) {
      setApiMessage({ text: "New password and confirmation do not match.", type: 'error' });
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
        const successMsg = response.data?.message || "Password changed successfully.";
        setApiMessage({ text: successMsg, type: 'success' });
        
        setForm({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
      } else {
        const errorMsg = response.data?.message || "Unable to change password.";
        setApiMessage({ text: errorMsg, type: 'error' });
      }
    } catch (error: any) {
      console.error("Change password error:", error);
      
      const errorMsg = error?.response?.data?.message || "Unable to change password.";
      setApiMessage({ text: errorMsg, type: 'error' });
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
      className="min-h-screen bg-[#faf8f3] p-4 sm:p-5 lg:p-7"
    >
      {/* HEADER */}
      <motion.div
        variants={itemVariants}
        className="mb-6"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9a741b]">
            Account Security
          </span>
        </div>

        <h1 className="font-serif text-[30px] font-bold tracking-tight text-[#29251f] sm:text-[34px]">
          Change Password
        </h1>

        <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#8d8372]">
          Update your account password and keep your administrator account secure.
        </p>
      </motion.div>

      {/* MAIN CARD */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,720px)_320px]">
        {/* FORM */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-[22px] border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)]"
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]" />

          <div className="border-b border-[#b8902e]/10 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#faf4df] text-[#b8902e]">
                <FiLock size={19} />
              </div>

              <div>
                <h2 className="text-[17px] font-bold text-[#29251f]">
                  Password Settings
                </h2>
                <p className="mt-0.5 text-xs text-[#a19583]">
                  Enter your current password and choose a new secure password.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
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

            {/* STRENGTH - Only show if password is not strong */}
            {form.new_password && !isStrongPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-4 overflow-hidden"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#786f60]">
                    Password Strength
                  </span>

                  <span className="text-[10px] font-bold text-[#8f6d1d]">
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
                      className={`h-1.5 flex-1 rounded-full ${
                        item <= passwordScore
                          ? "bg-[#b8902e]"
                          : "bg-[#e7e0d2]"
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
                        className={`flex h-5 w-5 items-center justify-center rounded-md ${
                          valid
                            ? "bg-[#b8902e] text-white"
                            : "bg-[#eee9de] text-[#aaa18f]"
                        }`}
                      >
                        <FiCheck size={11} />
                      </span>
                      <span className="text-[10px] text-[#786f60]">
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
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                  form.new_password === form.new_password_confirmation
                    ? "border-[#b8902e]/20 bg-[#f8f3e5] text-[#806319]"
                    : "border-[#c98d83]/20 bg-[#fff8f6] text-[#a15349]"
                }`}
              >
                {form.new_password === form.new_password_confirmation
                  ? "✓ Passwords match."
                  : "Passwords do not match."}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4 sm:px-6">
            {/* API Message Display */}
            <AnimatePresence>
              {apiMessage && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`text-sm font-medium ${
                    apiMessage.type === 'success' 
                      ? 'text-green-600' 
                      : 'text-red-600'
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
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-[#a8841c] hover:to-[#7c5d12] disabled:cursor-not-allowed disabled:opacity-50 ml-auto"
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

        {/* SIDE INFO */}
        <motion.div
          variants={itemVariants}
          className="relative h-fit overflow-hidden rounded-[22px] border border-[#b8902e]/12 bg-white shadow-[0_8px_30px_rgba(70,55,20,0.045)]"
        >
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#e8c97a] to-[#8a6c1f]" />

          <div className="p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
              <FiShield size={19} />
            </div>

            <h3 className="mt-4 text-[16px] font-bold text-[#29251f]">
              Account Security
            </h3>

            <p className="mt-1.5 text-xs leading-5 text-[#8d8372]">
              Use a strong password that is difficult to guess and avoid reusing passwords.
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
                  className="flex items-start gap-2.5 rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] p-3"
                >
                  <FiCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-[#b8902e]"
                  />
                  <span className="text-[11px] leading-4 text-[#786f60]">
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