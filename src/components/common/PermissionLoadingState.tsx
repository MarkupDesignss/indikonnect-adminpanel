import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface PermissionLoadingStateProps {
  logoUrl: string | null;
}

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";


const DOT_COLORS = ["#2D6FE8", "#FACC15", "#4F8FF7"];

const PermissionLoadingState: React.FC<PermissionLoadingStateProps> = ({
  logoUrl,
}) => {
  const [displayLogo, setDisplayLogo] = useState(logoUrl || DEFAULT_LOGO_URL);

  useEffect(() => {
    setDisplayLogo(logoUrl || DEFAULT_LOGO_URL);
  }, [logoUrl]);

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-white p-6 font-poppins">
      {/* Logo with soft glow */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute h-[170px] w-[170px] rounded-full"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.img
          key={displayLogo}
          src={displayLogo}
          alt="IndieKonnect Logo"
          className="relative z-10 block max-h-[140px] max-w-[280px] object-contain"
          referrerPolicy="no-referrer"
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{
            opacity: 1,
            scale: [1, 1.04, 1],
            y: 0,
          }}
          transition={{
            opacity: { duration: 0.5 },
            y: { duration: 0.5 },
            scale: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          onError={() => {
            if (displayLogo !== DEFAULT_LOGO_URL) {
              setDisplayLogo(DEFAULT_LOGO_URL);
            }
          }}
        />
      </div>

      {/* Loading text + colored dots */}
      <motion.div
        className="mt-5 flex items-center gap-2.5 text-sm font-medium text-[#4A5568]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <span>Loading</span>
        <span className="flex items-center gap-1.5">
          {DOT_COLORS.map((color, i) => (
            <motion.span
              key={color}
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color }}
              animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15,
              }}
            />
          ))}
        </span>
      </motion.div>
    </div>
  );
};

export default PermissionLoadingState;