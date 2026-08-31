import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminApi } from '../../api/endpoints/Auth';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await adminApi.login({
        email: email.trim(),
        password: password.trim()
      });

      if (response.data.success) {
        sessionStorage.setItem('adminToken', response.data.data.token);
        
        toast.success(response.data.message || 'Login successful! Welcome back!', {
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
          navigate('/dashboard');
        }, 1000);
      } else {

        setError(response.data.message || 'Invalid email or password');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Invalid email or password. Please try again.';
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

      {/* Login Card */}
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
              IndieKonnect
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

          {/* Login Form */}
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
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-on-surface-variant text-sm font-medium mb-1.5">
                Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-secondary transition-colors duration-200 text-xl">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-surface/50 border border-border-light rounded-xl focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-300 text-on-surface placeholder:text-on-surface-variant/30 hover:bg-surface/80"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-secondary transition-colors duration-200"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </motion.div>

            {/* Forgot Password */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between"
            >
              <label className="flex items-center gap-2 text-sm text-on-surface-variant/60 hover:text-on-surface-variant transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border-light text-secondary focus:ring-2 focus:ring-secondary/20 cursor-pointer"
                />
                Remember me
              </label>
              <Link 
                to="/forgot-password"
                className="text-sm text-secondary hover:text-secondary/80 font-medium underline transition-colors hover:underline underline-offset-2"
              >
                Forgot password?
              </Link>
            </motion.div>

            {/* Login Button */}
            <motion.div variants={itemVariants}>
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">login</span>
                      Sign In
                    </>
                  )}
                </span>
                {/* Button hover shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-white/10 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </motion.button>
            </motion.div>
          </form>

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

export default Login;