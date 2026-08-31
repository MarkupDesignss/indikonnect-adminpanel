// src/pages/ResetPassword.tsx

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminApi } from '../../api/endpoints/Auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email] = useState(
    location.state?.email || ''
  );
  const [resetToken] = useState(
    location.state?.resetToken || ''
  );
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if no email or reset token
  useState(() => {
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
        reset_token: resetToken // Include reset token in API call
      });

      // Check if reset was successful
      if (response.data.message || response.status === 200) {
        setSuccess(true);
        
        // Show success toast
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

        // Redirect to login after 2 seconds
        setTimeout(() => {
          setIsLoading(false);
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to reset password. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      // Handle API errors
      console.error('Reset password error:', err);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to reset password. Please try again.';
      
      // Only show error in form, no toast
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

      {/* Reset Password Card */}
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
              Reset Password
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-on-surface-variant/60 mt-1 text-sm font-light"
            >
              Create a new password for your account
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-5 w-16 h-0.5 bg-gradient-to-r from-secondary to-secondary-container mx-auto rounded-full"
            />
          </motion.div>

          {/* Error Message - Only in form */}
          {error && !success && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-xl text-status-error text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </motion.div>
          )}

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-on-surface-variant text-sm font-medium mb-1.5">
                New Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-secondary transition-colors duration-200 text-xl">
                  lock
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-surface/50 border border-border-light rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-300 text-on-surface placeholder:text-on-surface-variant/30 hover:bg-surface/80"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-secondary transition-colors duration-200"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showNewPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-on-surface-variant text-sm font-medium mb-1.5">
                Confirm Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-secondary transition-colors duration-200 text-xl">
                  lock
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-surface/50 border border-border-light rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-300 text-on-surface placeholder:text-on-surface-variant/30 hover:bg-surface/80"
                  placeholder="Confirm your new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-secondary transition-colors duration-200"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-status-error text-xs mt-1.5 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">error</span>
                  Passwords do not match
                </motion.p>
              )}
              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-status-success text-xs mt-1.5 flex items-center gap-1"
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
                  <div className="flex-1 h-1 bg-border-light rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        newPassword.length < 4
                          ? 'w-1/4 bg-status-error'
                          : newPassword.length < 8
                          ? 'w-1/2 bg-status-warning'
                          : 'w-full bg-status-success'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-medium text-on-surface-variant/60 whitespace-nowrap">
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
            <motion.div variants={itemVariants}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || success}
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
                      Resetting Password...
                    </>
                  ) : success ? (
                    <>
                      <span className="material-symbols-outlined text-xl">check_circle</span>
                      Password Reset Successfully!
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">key</span>
                      Reset Password
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-white/10 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </motion.button>
            </motion.div>
          </form>

          {/* Back to Login */}
          <motion.div
            variants={itemVariants}
            className="mt-6 text-center space-y-3"
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-on-surface-variant/60 hover:text-secondary transition-colors duration-200 group"
            >
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
              Back to Sign In
            </Link>
            
            <p className="text-xs text-on-surface-variant/40">
              &copy; 2026 IndieKonnect. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;