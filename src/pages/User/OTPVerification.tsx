import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminApi } from '../../api/endpoints/Auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
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
    const otpValue = otp.join('');
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

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
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
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await adminApi.verifyOtp({
        email: email,
        otp: otpValue
      });

      // Check if verification was successful
      if (response.data.success || response.data.message) {
        // Extract reset token from response
        const resetToken = response.data.data?.reset_token || '';
        const expiresIn = response.data.data?.expires_in || '10 minutes';

        // Show success toast
        toast.success(response.data.message || 'OTP verified successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });

        // Navigate to reset password with email, otp, and reset token
        setTimeout(() => {
          setIsLoading(false);
          navigate('/ResetPassword', {
            state: {
              email: email,
              otp: otpValue,
              resetToken: resetToken,
              expiresIn: expiresIn
            }
          });
        }, 1000);
      } else {
        setError(response.data.message || 'Invalid OTP. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Invalid OTP. Please try again.';
      
      // Only show error in form, no toast
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    handleVerifyOTP(otpValue);
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setResendTimer(30);
    setCanResend(false);
    setError('');

    try {
      const response = await adminApi.forgotPassword({
        email: email
      });

      if (response.data.message || response.status === 200) {
        // Show success toast for resend
        toast.success(response.data.message || 'OTP resent successfully!', {
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
        setError(response.data.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to resend OTP. Please try again.';
      
      // Only show error in form, no toast
      setError(errorMessage);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const floatingCircleVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-subtle via-surface to-surface-subtle flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Toast Container - Only for success toasts */}
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
      
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          variants={floatingCircleVariants}
          animate="animate"
          className="absolute -top-20 -right-20 w-96 h-96"
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="100" fill="#febb24" opacity="0.08" />
          </svg>
        </motion.div>

        <motion.div
          variants={floatingCircleVariants}
          animate="animate"
          transition={{ delay: 1, duration: 5 }}
          className="absolute -bottom-20 -left-20 w-80 h-80"
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="100" fill="#7c5800" opacity="0.06" />
          </svg>
        </motion.div>

        <motion.div
          variants={floatingCircleVariants}
          animate="animate"
          transition={{ delay: 2, duration: 6 }}
          className="absolute top-1/3 -right-10 w-56 h-56"
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="100" fill="#000000" opacity="0.04" />
          </svg>
        </motion.div>

        <motion.div
          variants={floatingCircleVariants}
          animate="animate"
          transition={{ delay: 0.5, duration: 3.5 }}
          className="absolute top-10 left-10 w-20 h-20"
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="100" fill="#febb24" opacity="0.06" />
          </svg>
        </motion.div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary-container/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-container/5 rounded-full blur-2xl animate-pulse delay-1000" />
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
          className="bg-surface-container-lowest/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-primary/10 border border-outline-variant/20 p-8 md:p-10 hover:shadow-3xl transition-shadow duration-500 min-h-[500px] md:min-h-[550px] flex flex-col justify-between"
        >
          {/* Top Section */}
          <div>
            {/* Logo & Brand */}
            <motion.div variants={itemVariants} className="text-center mb-7">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="flex justify-center mb-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-secondary-container/20 rounded-2xl blur-2xl" />
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary-container/30 to-secondary-container/10 flex items-center justify-center shadow-xl shadow-secondary-container/10">
                    <img
                      src="/assets/logo.png"
                      alt="IndieKonnect Logo"
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
              >
                Verify OTP
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="text-on-surface-variant/60 mt-1 text-xs font-light tracking-[0.2em] uppercase"
              >
                Wholesale Portal
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="mt-5 w-16 h-0.5 bg-gradient-to-r from-secondary to-secondary-container mx-auto rounded-full"
              />
            </motion.div>

            {/* Header Text */}
            <motion.div variants={itemVariants} className="text-center mb-6">
              <p className="text-on-surface-variant/60 text-sm mt-1">
                Enter 6-digit code sent to
              </p>
              <p className="text-on-surface font-medium text-sm mt-0.5">
                {email}
              </p>
            </motion.div>

            {/* Error Message - Only in form */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-xl text-status-error text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </motion.div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* OTP Inputs */}
              <motion.div variants={itemVariants}>
                <div className="flex justify-center gap-3">
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
                      className="w-12 h-14 text-center text-xl font-semibold bg-surface/50 border border-border-light rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-300 text-on-surface hover:bg-surface/80"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Resend */}
              <motion.div variants={itemVariants} className="text-center">
                <p className="text-sm text-on-surface-variant/60">
                  Didn't receive code?{' '}
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-secondary hover:text-secondary/80 font-medium underline transition-colors"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span className="text-on-surface-variant/40">
                      Resend in {resendTimer}s
                    </span>
                  )}
                </p>
              </motion.div>

              {/* Buttons */}
              <motion.div variants={itemVariants} className="space-y-3">
                {/* Verify Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#071A41] text-white rounded-xl font-semibold shadow-lg shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
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
                        <span className="material-symbols-outlined text-xl">verified</span>
                        Verify OTP
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-white/10 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </motion.button>

                {/* Back to Login */}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 text-on-surface-variant/60 hover:text-secondary font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Back to Login
                </button>
              </motion.div>
            </form>
          </div>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="mt-6 text-center"
          >
            <p className="text-xs text-on-surface-variant/40">
              &copy; 2026 IndieKonnect. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OTPVerification;