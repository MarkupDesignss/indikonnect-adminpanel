import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { adminApi } from "../../api/endpoints/Auth";
import { toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await adminApi.login({
        email: email.trim(),
        password: password.trim(),
      });

      if (response.data.success) {
        sessionStorage.setItem("adminToken", response.data.data.token);

        toast.success(
          response.data.message || "Login successful! Welcome back!",
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
          navigate("/dashboard");
        }, 1000);
      } else {
        setError(response.data.message || "Invalid email or password");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid email or password. Please try again.";
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
        type: "spring",
        stiffness: 120,
        damping: 14,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Simple static background circles (no animation, no blur) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[#163F20]/5" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#4C8A57]/5" />
        <div className="absolute top-1/3 -right-10 w-56 h-56 rounded-full bg-[#163F20]/5" />
      </div>

      {/* Login Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative w-full max-w-[440px]"
      >
        <motion.div
          variants={itemVariants}
          className="
            bg-white
            rounded-2xl
            border
            border-[#163F20]/10
            p-8 md:p-10
          "
        >
          {/* Logo & Brand */}
          <motion.div variants={itemVariants} className="text-center mb-7">
            <div className="flex justify-center mb-4">
              <div
                className="
                  w-20
                  h-20
                  rounded-2xl
                  bg-[#EAF3EA]
                  flex
                  items-center
                  justify-center
                "
              >
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
              IndieKonnect
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
              className="
                mb-4
                p-3
                bg-red-50
                border
                border-red-200
                rounded-lg
                text-red-600
                text-sm
                flex
                items-center
                gap-2
              "
            >
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-[#59645C] text-sm font-medium mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <span
                  className="
                    material-symbols-outlined
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-[#89918B]
                    group-focus-within:text-[#163F20]
                    transition-colors
                    text-xl
                  "
                >
                  email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    w-full
                    pl-10
                    pr-4
                    py-3
                    bg-[#F5F7F5]
                    border
                    border-[#163F20]/15
                    rounded-lg
                    focus:outline-none
                    focus:border-[#163F20]
                    focus:bg-white
                    transition-colors
                    text-[#202721]
                    placeholder:text-[#89918B]
                  "
                  placeholder="Enter your email"
                  required
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-[#59645C] text-sm font-medium mb-1.5">
                Password
              </label>
              <div className="relative group">
                <span
                  className="
                    material-symbols-outlined
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-[#89918B]
                    group-focus-within:text-[#163F20]
                    transition-colors
                    text-xl
                  "
                >
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    w-full
                    pl-10
                    pr-12
                    py-3
                    bg-[#F5F7F5]
                    border
                    border-[#163F20]/15
                    rounded-lg
                    focus:outline-none
                    focus:border-[#163F20]
                    focus:bg-white
                    transition-colors
                    text-[#202721]
                    placeholder:text-[#89918B]
                  "
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-[#89918B]
                    hover:text-[#163F20]
                    transition-colors
                  "
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </motion.div>

            {/* Forgot Password */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between"
            >
              <label className="flex items-center gap-2 text-sm text-[#59645C] cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-[#163F20]/20 accent-[#163F20] cursor-pointer"
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-[#163F20] hover:text-[#4C8A57] font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </motion.div>

            {/* Login Button */}
            <motion.div variants={itemVariants}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="
                  w-full
                  py-3.5
                  bg-[#163F20]
                  hover:bg-[#0F3219]
                  text-white
                  rounded-lg
                  font-semibold
                  transition-colors
                  duration-200
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  flex
                  items-center
                  justify-center
                  gap-2
                "
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">
                      login
                    </span>
                    Sign In
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-6 text-center">
            <p className="text-xs text-[#89918B]">
              &copy; 2026 IndieKonnect. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
