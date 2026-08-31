import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminApi } from '../../api/endpoints/Auth';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await adminApi.forgotPassword({
        email: email.trim()
      });

      if (response.data.message || response.status === 200) {
        setSuccess(true);
        toast.success(response.data.message || 'Password reset link sent successfully!', {
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
          navigate('/otp-verification', { 
            state: { 
              email: email.trim(),
              from: 'forgot-password'
            } 
          });
        }, 1000);
      } else {
        setError(response.data.message || 'Email not found. Please check and try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Email not found. Please check and try again.';
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
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Circles */}
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

        {/* Blur Circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary-container/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-container/5 rounded-full blur-2xl animate-pulse delay-1000" />
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
          className="bg-surface-container-lowest/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-primary/10 border border-outline-variant/20 p-8 md:p-10 hover:shadow-3xl transition-shadow duration-500"
        >
          {/* Logo & Brand */}
          <motion.div variants={itemVariants} className="text-center mb-7">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                {/* Glow behind logo */}
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
              Forgot Password?
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-on-surface-variant/60 mt-1 text-xs font-light tracking-[0.2em] uppercase"
            >
              Admin Portal
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-5 w-16 h-0.5 bg-gradient-to-r from-secondary to-secondary-container mx-auto rounded-full"
            />
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

          {/* Forgot Password Form */}
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-on-surface-variant text-sm font-medium mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-secondary transition-colors duration-200 text-xl">
                    email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface/50 border border-border-light rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-300 text-on-surface placeholder:text-on-surface-variant/30 hover:bg-surface/80"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <p className="text-xs text-on-surface-variant/40 mt-1.5">
                  Enter the email address associated with your account
                </p>
              </motion.div>

              {/* Buttons */}
              <motion.div variants={itemVariants} className="space-y-3">
                {/* Send Reset Link Button */}
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
                        Sending...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl">send</span>
                        Send Reset Link
                      </>
                    )}
                  </span>
                  {/* Button hover shine effect */}
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
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              variants={itemVariants}
              className="space-y-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-status-success/10 rounded-xl border border-status-success/20"
              >
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-2xl text-status-success">
                    mail
                  </span>
                  <div>
                    <h4 className="font-medium text-on-surface text-sm">Check your email</h4>
                    <p className="text-on-surface-variant/70 text-xs mt-1">
                      We've sent a password reset link to:
                      <br />
                      <span className="font-mono text-on-surface font-medium">
                        {email}
                      </span>
                    </p>
                    <p className="text-on-surface-variant/70 text-xs mt-2">
                      Please check your inbox and follow the instructions to reset your password.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-[#071A41] text-white rounded-xl font-semibold shadow-lg shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/30 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  Back to Login
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-white/10 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </motion.button>
            </motion.div>
          )}

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

export default ForgotPassword;