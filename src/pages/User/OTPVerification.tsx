import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { adminApi } from "../../api/endpoints/Auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  useEffect(() => {
    const otpValue = otp.join("");
    if (otpValue.length === 6 && !isLoading) {
      handleVerifyOTP(otpValue);
    }
  }, [otp]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d*$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    if (nextIndex < 6) {
      inputRefs.current[nextIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = async (otpValue: string) => {
    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await adminApi.verifyOtp({
        email: email,
        otp: otpValue,
      });

      if (response.data.success || response.data.message) {
        const resetToken = response.data.data?.reset_token || "";
        const expiresIn = response.data.data?.expires_in || "10 minutes";

        toast.success(response.data.message || "OTP verified successfully!", {
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
          navigate("/reset-password", {
            state: {
              email: email,
              otp: otpValue,
              resetToken: resetToken,
              expiresIn: expiresIn,
            },
          });
        }, 1000);
      } else {
        setError(response.data.message || "Invalid OTP. Please try again.");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid OTP. Please try again.";

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    handleVerifyOTP(otpValue);
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResendTimer(30);
    setCanResend(false);
    setError("");

    try {
      const response = await adminApi.forgotPassword({ email: email });

      if (response.data.message || response.status === 200) {
        toast.success(response.data.message || "OTP resent successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } else {
        setError(
          response.data.message || "Failed to resend OTP. Please try again.",
        );
      }
    } catch (err: any) {
      console.error("Resend OTP error:", err);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to resend OTP. Please try again.";

      setError(errorMessage);
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
      {/* Toast Container */}
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

      {/* Simple static background circles (no animation, no blur) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[#163F20]/5" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#4C8A57]/5" />
        <div className="absolute top-1/3 -right-10 w-56 h-56 rounded-full bg-[#163F20]/5" />
      </div>

      {/* OTP Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative w-full max-w-[460px]"
      >
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl border border-[#163F20]/10 p-8 md:p-10 min-h-[500px] md:min-h-[550px] flex flex-col justify-between"
        >
          {/* Top Section */}
          <div>
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
                Verify OTP
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

            {/* Header Text */}
            <motion.div variants={itemVariants} className="text-center mb-6">
              <p className="text-gray-500 text-sm mt-1">
                Enter 6-digit code sent to
              </p>
              <p className="text-gray-900 font-medium text-sm mt-0.5">
                {email}
              </p>
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

            {/* OTP Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* OTP Inputs */}
              <motion.div variants={itemVariants}>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-11 h-14 sm:w-12 text-center text-xl font-semibold bg-[#f5f7f5] border border-[#163F20]/15 rounded-lg focus:outline-none focus:border-[#163F20] focus:bg-white transition-colors text-gray-900"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Resend */}
              <motion.div variants={itemVariants} className="text-center">
                <p className="text-sm text-gray-500">
                  Didn't receive code?{" "}
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-[#163F20] hover:text-[#4C8A57] font-medium transition-colors"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span className="text-gray-400">
                      Resend in {resendTimer}s
                    </span>
                  )}
                </p>
              </motion.div>

              {/* Buttons */}
              <motion.div variants={itemVariants} className="space-y-3">
                {/* Verify Button */}
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
                      Verifying...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">
                        verified
                      </span>
                      Verify OTP
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
          </div>

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

export default OTPVerification;
