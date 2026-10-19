// src/pages/ResetPassword.tsx

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminApi } from '../../api/endpoints/Auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email] = useState(location.state?.email || '');
  const [resetToken] = useState(location.state?.resetToken || '');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ FIXED: useState ki jagah useEffect use kiya redirect ke liye
  useEffect(() => {
    if (!email || !resetToken) {
      navigate('/forgot-password');
    }
  }, [email, resetToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await adminApi.resetPassword({
        email: email,
        password: newPassword,
        password_confirmation: confirmPassword,
        reset_token: resetToken
      });

      if (response.data.message || response.status === 200) {
        setSuccess(true);

        toast.success(response.data.message || 'Password reset successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });

        setTimeout(() => {
          setIsLoading(false);
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to reset password. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Reset password error:', err);

      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to reset password. Please try again.';

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 14,
      },
    },
  };

  return (
    // ✅ FIXED: Mobile par top se start hoga, gap nahi aayega
    <div className="w-full min-h-screen bg-[#F4F8FD] flex flex-col items-center justify-start px-3 py-4 sm:px-4 sm:py-8 md:py-12 relative overflow-x-hidden font-poppins">

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3}
      />

      {/* Decorative Background Orbs (Sky Blue + Yellow) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -right-16 sm:-top-20 sm:-right-20 w-56 h-56 sm:w-96 sm:h-96 rounded-full bg-[#2D6FE8]/5" />
        <div className="absolute -bottom-16 -left-16 sm:-bottom-20 sm:-left-20 w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-[#FACC15]/10" />
        <div className="absolute top-1/3 -right-8 sm:-right-10 w-36 h-36 sm:w-56 sm:h-56 rounded-full bg-[#4F8FF7]/10" />
        <div className="absolute bottom-1/4 left-4 sm:left-10 w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-[#FDE047]/10" />
      </div>

      {/* Reset Password Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative w-full max-w-[460px] my-auto"
      >
        <motion.div
          variants={itemVariants}
          className="
            relative
            overflow-hidden
            bg-white
            rounded-2xl
            border
            border-[#DCE6F2]
            px-5
            py-7
            sm:px-8
            sm:py-9
            md:px-10
            md:py-10
            shadow-[0_18px_40px_-24px_rgba(45,111,232,0.28)]
          "
        >
          {/* Top accent strip */}
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#2D6FE8] via-[#5A95F6] to-[#FACC15]" />

          {/* Logo & Brand */}
          <motion.div variants={itemVariants} className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-[#EAF3FF] flex items-center justify-center border border-[#2D6FE8]/15 relative">
                <img
                  src={`${import.meta.env.BASE_URL}assets/logo.png`}
                  alt="IndieKonnect Logo"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                />
                {/* Yellow accent dot */}
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#FACC15] border-2 border-white" />
              </div>
            </div>

            <motion.h1
              variants={itemVariants}
              className="text-[26px] sm:text-3xl font-bold text-[#111827] leading-tight"
            >
              Reset Password
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-[#6B7280] mt-1.5 text-xs sm:text-sm"
            >
              Create a new password for your account
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-4 sm:mt-5 w-16 h-0.5 bg-gradient-to-r from-[#2D6FE8] to-[#FACC15] mx-auto rounded-full"
            />
          </motion.div>

          {/* Error Message */}
          {error && !success && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-5 p-3 bg-[#FEF2F2] border border-[#C23B32]/20 rounded-lg text-[#C23B32] text-xs sm:text-sm flex items-start sm:items-center gap-2 break-words"
            >
              <span className="material-symbols-outlined text-base sm:text-lg shrink-0 mt-0.5 sm:mt-0">
                error
              </span>
              <span className="min-w-0 font-medium">{error}</span>
            </motion.div>
          )}

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* New Password Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-[#111827] text-xs sm:text-sm font-semibold mb-1.5">
                New Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#2D6FE8] transition-colors duration-200 text-[20px] sm:text-[22px]">
                  lock
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-11 sm:pr-12 py-3 bg-[#F4F8FD] border border-[#D6E2F0] rounded-xl focus:outline-none focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#FACC15]/30 transition-all text-sm sm:text-base text-[#111827] placeholder:text-[#9CA3AF]"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#2D6FE8] transition-colors duration-200 p-1"
                >
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
                    {showNewPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-[#111827] text-xs sm:text-sm font-semibold mb-1.5">
                Confirm Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#2D6FE8] transition-colors duration-200 text-[20px] sm:text-[22px]">
                  lock
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-11 sm:pr-12 py-3 bg-[#F4F8FD] border border-[#D6E2F0] rounded-xl focus:outline-none focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#FACC15]/30 transition-all text-sm sm:text-base text-[#111827] placeholder:text-[#9CA3AF]"
                  placeholder="Confirm your new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#2D6FE8] transition-colors duration-200 p-1"
                >
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              
              {/* Match Indicators */}
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[#C23B32] text-[11px] sm:text-xs mt-1.5 flex items-center gap-1 font-medium"
                >
                  <span className="material-symbols-outlined text-sm">error</span>
                  Passwords do not match
                </motion.p>
              )}
              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[#059669] text-[11px] sm:text-xs mt-1.5 flex items-center gap-1 font-medium"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Passwords match
                </motion.p>
              )}
            </motion.div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#DCE6F2] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        newPassword.length < 4
                          ? 'w-1/4 bg-[#C23B32]'
                          : newPassword.length < 8
                            ? 'w-1/2 bg-[#FACC15]'
                            : 'w-full bg-[#059669]'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#6B7280] whitespace-nowrap">
                    {newPassword.length < 4
                      ? 'Weak'
                      : newPassword.length < 8
                        ? 'Medium'
                        : 'Strong'}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Reset Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || success}
                className="w-full py-3.5 bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] hover:from-[#2D6FE8] hover:to-[#1E40AF] text-white rounded-xl font-bold text-sm sm:text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_8px_20px_-8px_rgba(45,111,232,0.6)] hover:shadow-[0_12px_24px_-8px_rgba(250,204,21,0.5)] hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Resetting...
                    </>
                  ) : success ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] sm:text-[22px]">check_circle</span>
                      Password Reset!
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px] sm:text-[22px]">key</span>
                      Reset Password
                    </>
                  )}
                </span>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </motion.button>
            </motion.div>
          </form>

          {/* Back to Login */}
          <motion.div
            variants={itemVariants}
            className="mt-5 sm:mt-6 text-center space-y-3"
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#6B7280] hover:text-[#2D6FE8] font-semibold transition-colors duration-200 group"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-lg group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
              Back to Sign In
            </Link>

            <p className="text-[10px] sm:text-xs text-[#6B7280] leading-relaxed">
              &copy; 2026 IndieKonnect. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;