import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { adminApi } from "../../api/endpoints/Auth";
import { toast } from "react-toastify";
import { getPortalName } from "../../utils/getPortalName";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const portalName = getPortalName();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await adminApi.forgotPassword({
        email: email.trim(),
      });

      if (response.data.message || response.status === 200) {
        setSuccess(true);
        toast.success(
          response.data.message || "Password reset link sent successfully!",
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          },
        );

        setTimeout(() => {
          setIsLoading(false);
          navigate("/otp-verification", {
            state: {
              email: email.trim(),
              from: "forgot-password",
            },
          });
        }, 1000);
      } else {
        setError(
          response.data.message ||
            "Email not found. Please check and try again.",
        );
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Email not found. Please check and try again.";
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
        type: "spring" as const,
        stiffness: 120,
        damping: 14,
      },
    },
  };

  return (
    // ✅ FIXED: Mobile par upar-niche gap hataya, top se start hoga
    <div className="w-full min-h-screen bg-[#F4F8FD] flex flex-col items-center justify-start px-3 py-4 sm:px-4 sm:py-8 md:py-12 relative overflow-x-hidden font-poppins">
      
      {/* Decorative Background Orbs (Theme: Sky Blue + Yellow) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -right-16 sm:-top-20 sm:-right-20 w-56 h-56 sm:w-96 sm:h-96 rounded-full bg-[#2D6FE8]/5" />
        <div className="absolute -bottom-16 -left-16 sm:-bottom-20 sm:-left-20 w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-[#FACC15]/10" />
        <div className="absolute top-1/3 -right-8 sm:-right-10 w-36 h-36 sm:w-56 sm:h-56 rounded-full bg-[#4F8FF7]/10" />
        <div className="absolute bottom-1/4 left-4 sm:left-10 w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-[#FDE047]/10" />
      </div>

      {/* Forgot Password Card */}
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
              Forgot Password?
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-[#2D6FE8] mt-1.5 text-[11px] sm:text-xs font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase"
            >
              {portalName}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-4 sm:mt-5 w-16 h-0.5 bg-gradient-to-r from-[#2D6FE8] to-[#FACC15] mx-auto rounded-full"
            />
          </motion.div>

          {/* Error Message */}
          {error && (
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

          {/* Forgot Password Form */}
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Email Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-[#111827] text-xs sm:text-sm font-semibold mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#2D6FE8] transition-colors duration-200 text-[20px] sm:text-[22px]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#F4F8FD] border border-[#D6E2F0] rounded-xl focus:outline-none focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#FACC15]/30 transition-all text-sm sm:text-base text-[#111827] placeholder:text-[#9CA3AF]"
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                  />
                </div>
                <p className="text-[11px] sm:text-xs text-[#6B7280] mt-2 leading-relaxed">
                  Enter the email address associated with your account.
                </p>
              </motion.div>

              {/* Buttons */}
              <motion.div variants={itemVariants} className="space-y-3 pt-2">
                {/* Send Reset Link Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] hover:from-[#2D6FE8] hover:to-[#1E40AF] text-white rounded-xl font-bold text-sm sm:text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_8px_20px_-8px_rgba(45,111,232,0.6)] hover:shadow-[0_12px_24px_-8px_rgba(250,204,21,0.5)] hover:-translate-y-0.5 active:translate-y-0"
                >
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
                        send
                      </span>
                      Send Reset Link
                    </>
                  )}
                </motion.button>

                {/* Back to Login */}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full py-2.5 text-[#6B7280] hover:text-[#2D6FE8] font-semibold text-xs sm:text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-lg">
                    arrow_back
                  </span>
                  Back to Login
                </button>
              </motion.div>
            </form>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              variants={itemVariants}
              className="space-y-4 sm:space-y-5"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#EAF3FF] rounded-xl border border-[#2D6FE8]/15"
              >
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[22px] sm:text-2xl text-[#2D6FE8] shrink-0 mt-0.5">
                    mail
                  </span>
                  <div>
                    <h4 className="font-bold text-[#111827] text-sm sm:text-base">
                      Check your email
                    </h4>
                    <p className="text-[#6B7280] text-xs sm:text-sm mt-1 leading-relaxed">
                      We've sent a password reset link to:
                      <br />
                      <span className="font-mono text-[#111827] font-semibold break-all">
                        {email}
                      </span>
                    </p>
                    <p className="text-[#6B7280] text-xs sm:text-sm mt-2 leading-relaxed">
                      Please check your inbox and follow the instructions to
                      reset your password.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/login")}
                className="w-full py-3.5 bg-gradient-to-r from-[#4F8FF7] to-[#2D6FE8] hover:from-[#2D6FE8] hover:to-[#1E40AF] text-white rounded-xl font-bold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_8px_20px_-8px_rgba(45,111,232,0.6)] hover:shadow-[0_12px_24px_-8px_rgba(250,204,21,0.5)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
                  arrow_forward
                </span>
                Back to Login
              </motion.button>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-5 sm:mt-6 text-center">
            <p className="text-[10px] sm:text-xs text-[#6B7280] leading-relaxed">
              &copy; 2026 IndieKonnect. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;