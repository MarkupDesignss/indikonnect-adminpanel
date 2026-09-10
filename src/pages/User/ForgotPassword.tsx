import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { adminApi } from "../../api/endpoints/Auth";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const navigate = useNavigate();
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

  // Animation variants (simplified)
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
    <div className="min-h-screen bg-[#f5f7f5] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Simple static background circles (no animation, no blur) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[#163F20]/5" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#4C8A57]/5" />
        <div className="absolute top-1/3 -right-10 w-56 h-56 rounded-full bg-[#163F20]/5" />
      </div>

      {/* Forgot Password Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative w-full max-w-[460px]"
      >
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-[#163F20]/10 p-8 md:p-10"
        >
          {/* Logo & Brand */}
          <motion.div variants={itemVariants} className="text-center mb-7">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl bg-[#EAF3EA] flex items-center justify-center">
                <img
                  src={`${import.meta.env.BASE_URL}assets/logo.png`}
                  alt="IndieKonnect Logo"
                  className="w-14 h-14 object-contain"
                />
              </div>
            </div>

            <motion.h1
              variants={itemVariants}
              className="text-3xl font-bold text-[#163F20]"
            >
              Forgot Password?
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-[#4C8A57] mt-1 text-xs font-semibold tracking-[0.2em] uppercase"
            >
              Admin Portal
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-5 w-16 h-0.5 bg-[#163F20] mx-auto rounded-full"
            />
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </motion.div>
          )}

          {/* Forgot Password Form */}
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-gray-600 text-sm font-medium mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#163F20] transition-colors duration-200 text-xl">
                    email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f5f7f5] border border-[#163F20]/15 rounded-lg focus:outline-none focus:border-[#163F20] focus:bg-white transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Enter the email address associated with your account
                </p>
              </motion.div>

              {/* Buttons */}
              <motion.div variants={itemVariants} className="space-y-3">
                {/* Send Reset Link Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#163F20] hover:bg-[#0F3219] text-white rounded-lg font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
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
                      <span className="material-symbols-outlined text-xl">
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
                  className="w-full py-2.5 text-gray-500 hover:text-[#163F20] font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-lg">
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
              className="space-y-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#EAF3EA] rounded-lg border border-[#163F20]/15"
              >
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-2xl text-[#163F20]">
                    mail
                  </span>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">
                      Check your email
                    </h4>
                    <p className="text-gray-600 text-xs mt-1">
                      We've sent a password reset link to:
                      <br />
                      <span className="font-mono text-gray-900 font-medium">
                        {email}
                      </span>
                    </p>
                    <p className="text-gray-600 text-xs mt-2">
                      Please check your inbox and follow the instructions to
                      reset your password.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/login")}
                className="w-full py-3.5 bg-[#163F20] hover:bg-[#0F3219] text-white rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">
                  arrow_forward
                </span>
                Back to Login
              </motion.button>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              &copy; 2026 IndieKonnect. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
