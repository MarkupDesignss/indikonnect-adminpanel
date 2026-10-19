import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { adminApi } from "../../api/endpoints/Auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getPortalName } from "../../utils/getPortalName";

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const portalName = getPortalName();

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

      {/* OTP Card */}
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
            flex
            flex-col
            justify-between
          "
        >
          {/* Top accent strip */}
          <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#2D6FE8] via-[#5A95F6] to-[#FACC15]" />

          {/* Top Section */}
          <div>
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
                Verify OTP
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

            {/* Header Text */}
            <motion.div variants={itemVariants} className="text-center mb-5 sm:mb-6">
              <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
                Enter 6-digit code sent to
              </p>
              <p className="text-[#111827] font-semibold text-xs sm:text-sm mt-1 break-all px-2">
                {email}
              </p>
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

            {/* OTP Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* OTP Inputs */}
              <motion.div variants={itemVariants} className="w-full">
                {/* ✅ FIXED: Mobile par OTP boxes ek line me perfectly fit honge */}
                <div className="flex justify-center gap-1.5 xs:gap-2 sm:gap-3 w-full">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-[42px] h-[52px] xs:w-[46px] xs:h-[56px] sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-[#F4F8FD] border border-[#D6E2F0] rounded-xl focus:outline-none focus:border-[#2D6FE8] focus:bg-white focus:ring-2 focus:ring-[#FACC15]/40 transition-all text-[#111827]"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Resend */}
              <motion.div variants={itemVariants} className="text-center">
                <p className="text-xs sm:text-sm text-[#6B7280]">
                  Didn't receive code?{" "}
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-[#2D6FE8] hover:text-[#4F8FF7] font-semibold transition-colors ml-1"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span className="text-[#9CA3AF] ml-1">
                      Resend in {resendTimer}s
                    </span>
                  )}
                </p>
              </motion.div>

              {/* Buttons */}
              <motion.div variants={itemVariants} className="space-y-3 pt-2">
                {/* Verify Button */}
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
                      Verifying...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
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
                  className="w-full py-2.5 text-[#6B7280] hover:text-[#2D6FE8] font-semibold text-xs sm:text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-lg">
                    arrow_back
                  </span>
                  Back to Login
                </button>
              </motion.div>
            </form>
          </div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-[10px] sm:text-xs text-[#6B7280] leading-relaxed">
              &copy; 2026 IndieKonnect. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OTPVerification;