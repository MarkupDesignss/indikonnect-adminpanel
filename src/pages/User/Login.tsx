import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { adminApi } from "../../api/endpoints/Auth";
import { toast } from "react-toastify";
import { getPortalName } from "../../utils/getPortalName";

const Login = () => {
  const navigate = useNavigate();
  const portalName = getPortalName();
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
        const token = response.data.data.token;
        localStorage.setItem("adminToken", token);

        if (response.data.data.admin) {
          localStorage.setItem("adminData", JSON.stringify(response.data.data.admin));
        }
        if (response.data.data.permissions) {
          localStorage.setItem("adminPermissions", JSON.stringify(response.data.data.permissions));
        }
        if (response.data.data.roles) {
          localStorage.setItem("adminRoles", JSON.stringify(response.data.data.roles));
        }

        toast.success(response.data.message || "Login successful! Welcome back!", {
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
          navigate("/dashboard", { replace: true });
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 120, damping: 14 },
    },
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#F4F8FD] flex items-center justify-center px-3 py-6 sm:px-4 sm:py-8 md:p-6 relative overflow-hidden font-poppins">
      {/* Decorative Background Orbs — smaller on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -right-16 sm:-top-20 sm:-right-20 w-56 h-56 sm:w-96 sm:h-96 rounded-full bg-[#2D6FE8]/5" />
        <div className="absolute -bottom-16 -left-16 sm:-bottom-20 sm:-left-20 w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-[#FACC15]/10" />
        <div className="absolute top-1/3 -right-8 sm:-right-10 w-36 h-36 sm:w-56 sm:h-56 rounded-full bg-[#4F8FF7]/10" />
        <div className="absolute bottom-1/4 left-4 sm:left-10 w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-[#FDE047]/10" />
      </div>

      {/* Login Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative w-full max-w-[440px] sm:max-w-[440px]"
      >
        <motion.div
          variants={itemVariants}
          className="
            relative
            overflow-hidden
            bg-white
            rounded-xl
            sm:rounded-2xl
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
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#2D6FE8] via-[#5A95F6] to-[#FACC15]" />

          {/* Logo & Brand */}
          <motion.div variants={itemVariants} className="text-center mb-5 sm:mb-6 md:mb-7">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div
                className="
                  w-16
                  h-16
                  sm:w-20
                  sm:h-20
                  rounded-2xl
                  bg-[#EAF3FF]
                  flex
                  items-center
                  justify-center
                  border
                  border-[#2D6FE8]/15
                  relative
                "
              >
                <img
                  src={`${import.meta.env.BASE_URL}assets/logo.png`}
                  alt="IndieKonnect Logo"
                  className="w-10 h-10 sm:w-14 sm:h-14 object-contain"
                />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#FACC15] border-2 border-white" />
              </div>
            </div>

            <motion.h1
              variants={itemVariants}
              className="text-2xl sm:text-3xl md:text-3xl font-bold text-[#111827] leading-tight"
            >
              IndieKonnect
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="
                text-[#2D6FE8]
                mt-1
                text-[10px]
                sm:text-xs
                font-semibold
                tracking-[0.18em]
                sm:tracking-[0.2em]
                uppercase
              "
            >
              {portalName}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-4 sm:mt-5 w-14 sm:w-16 h-0.5 bg-gradient-to-r from-[#2D6FE8] to-[#FACC15] mx-auto rounded-full"
            />
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="
                mb-4
                p-2.5
                sm:p-3
                bg-[#FEF2F2]
                border
                border-[#C23B32]/20
                rounded-lg
                text-[#C23B32]
                text-xs
                sm:text-sm
                flex
                items-start
                sm:items-center
                gap-2
                break-words
              "
            >
              <span className="material-symbols-outlined text-base sm:text-lg shrink-0 mt-0.5 sm:mt-0">
                error
              </span>
              <span className="min-w-0">{error}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email */}
            <motion.div variants={itemVariants}>
              <label className="block text-[#111827] text-xs sm:text-sm font-semibold mb-1.5">
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
                    text-[#9CA3AF]
                    group-focus-within:text-[#2D6FE8]
                    transition-colors
                    text-lg
                    sm:text-xl
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
                    pr-3
                    sm:pr-4
                    py-2.5
                    sm:py-3
                    bg-[#F4F8FD]
                    border
                    border-[#D6E2F0]
                    rounded-lg
                    sm:rounded-xl
                    focus:outline-none
                    focus:border-[#2D6FE8]
                    focus:bg-white
                    focus:ring-2
                    focus:ring-[#FACC15]/30
                    transition-all
                    text-sm
                    sm:text-base
                    text-[#111827]
                    placeholder:text-[#9CA3AF]
                  "
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants}>
              <label className="block text-[#111827] text-xs sm:text-sm font-semibold mb-1.5">
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
                    text-[#9CA3AF]
                    group-focus-within:text-[#2D6FE8]
                    transition-colors
                    text-lg
                    sm:text-xl
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
                    pr-11
                    sm:pr-12
                    py-2.5
                    sm:py-3
                    bg-[#F4F8FD]
                    border
                    border-[#D6E2F0]
                    rounded-lg
                    sm:rounded-xl
                    focus:outline-none
                    focus:border-[#2D6FE8]
                    focus:bg-white
                    focus:ring-2
                    focus:ring-[#FACC15]/30
                    transition-all
                    text-sm
                    sm:text-base
                    text-[#111827]
                    placeholder:text-[#9CA3AF]
                  "
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute
                    right-2.5
                    sm:right-3
                    top-1/2
                    -translate-y-1/2
                    text-[#9CA3AF]
                    hover:text-[#2D6FE8]
                    transition-colors
                    p-1
                  "
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-lg sm:text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </motion.div>

            {/* Remember / Forgot — stacks nicely on tiny screens */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col xs:flex-row sm:flex-row items-start xs:items-center sm:items-center justify-between gap-2 sm:gap-3"
            >
              <label className="flex items-center gap-2 text-xs sm:text-sm text-[#6B7280] cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-[#D6E2F0] accent-[#2D6FE8] cursor-pointer w-4 h-4"
                />
                Remember me
              </label>

              <Link
                to="/forgot-password"
                className="text-xs sm:text-sm text-[#2D6FE8] hover:text-[#4F8FF7] font-semibold transition-colors"
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
                  py-3
                  sm:py-3.5
                  bg-gradient-to-br
                  from-[#4F8FF7]
                  to-[#2D6FE8]
                  hover:from-[#2D6FE8]
                  hover:to-[#1E40AF]
                  text-white
                  rounded-lg
                  sm:rounded-xl
                  font-bold
                  text-sm
                  sm:text-base
                  transition-all
                  duration-200
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  flex
                  items-center
                  justify-center
                  gap-2
                  shadow-[0_10px_22px_-10px_rgba(45,111,232,0.6)]
                  hover:shadow-[0_14px_28px_-10px_rgba(250,204,21,0.5)]
                  hover:-translate-y-0.5
                  active:translate-y-0
                "
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg sm:text-xl">
                      login
                    </span>
                    Sign In
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* Yellow accent divider */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3 pt-1"
            >
              <span className="h-px flex-1 bg-[#DCE6F2]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15]" />
              <span className="h-px flex-1 bg-[#DCE6F2]" />
            </motion.div>
          </form>

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

export default Login;