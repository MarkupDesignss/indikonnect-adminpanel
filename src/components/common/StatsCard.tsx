import React from "react";
import { motion } from "framer-motion";

interface StatItem {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  barColor?: string;
  textColor?: string;
  valueColor?: string;
}

interface StatsCardProps {
  stats?: StatItem[];
  className?: string;
  gridCols?: string;
}

const defaultGradient =
  "bg-gradient-to-r from-[#d4af52] via-[#b8902e] to-[#8a6c1f]";

const StatsCard: React.FC<StatsCardProps> = ({
  stats = [],
  className = "",
  gridCols = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
}) => {
  // =====================================================
  // EMPTY / LOADING STATE
  // =====================================================

  if (!stats || stats.length === 0) {
    return (
      <div
        className={`grid gap-4 ${gridCols} ${className}`}
      >
        {[1, 2, 3, 4].map((item) => (
          <motion.div
            key={item}
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="relative min-h-[140px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white px-5 py-5 shadow-sm"
          >
            {/* Gold Accent */}

            <div
              className={`absolute left-0 top-0 h-1 w-full ${defaultGradient}`}
            />

            {/* Decorative Circles */}

            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#d4af52]/20" />

            <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full border border-[#b8902e]/10" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="w-full">
                <div className="h-3 w-28 animate-pulse rounded-full bg-[#eee8da]" />

                <div className="mt-4 h-9 w-24 animate-pulse rounded-lg bg-[#f3efe6]" />

                <div className="mt-3 h-2.5 w-20 animate-pulse rounded-full bg-[#eee8da]" />
              </div>

              <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-[#f3efe6]" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // =====================================================
  // STATS
  // =====================================================

  return (
    <div
      className={`grid gap-4 ${gridCols} ${className}`}
    >
      {stats.map((item, index) => (
        <motion.div
          key={`${item.title}-${index}`}
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: index * 0.06,
            type: "spring",
            stiffness: 110,
            damping: 14,
          }}
          whileHover={{
            y: -4,
            boxShadow:
              "0 16px 30px -18px rgba(140,105,25,0.30)",
          }}
          className="group relative min-h-[140px] overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white px-5 py-5 shadow-sm transition-all duration-300"
        >
          {/* =================================================
              TOP GOLD ACCENT
          ================================================= */}

          <div
            className={`absolute left-0 top-0 h-1 w-full ${
              item.barColor || defaultGradient
            }`}
          />

          {/* =================================================
              DECORATIVE CIRCLES
          ================================================= */}

          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#d4af52]/20 transition-transform duration-500 group-hover:scale-110" />

          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full border border-[#b8902e]/12" />

          <div className="pointer-events-none absolute right-7 top-7 h-2.5 w-2.5 rounded-full bg-[#d4af52]/35" />

          {/* Soft glow */}

          <div className="pointer-events-none absolute -right-8 top-8 h-20 w-20 rounded-full bg-[#d4af52]/5 blur-2xl" />

          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {/* Title */}

              <p
                className={`font-lato text-[11px] font-bold uppercase tracking-[0.12em] text-black`}
              >
                {item.title}
              </p>

              {/* Value */}

              <motion.h2
                initial={{
                  opacity: 0,
                  scale: 0.85,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay:
                    index * 0.06 + 0.12,
                  type: "spring",
                  stiffness: 180,
                }}
                className={`mt-2 font-lato text-[34px] font-bold leading-none tracking-[-1.5px] text-black`}      >
                {item.value}
              </motion.h2>

              {/* Bottom accent */}

              <div className="mt-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

                <span className="text-[10px] font-medium text-[#a89a7d]">
                  Overview
                </span>
              </div>
            </div>

            {/* =================================================
                ICON BOX
            ================================================= */}

            <div className="relative shrink-0">
              <div className="flex h-6 w-6 items-center justify-center rounded-xl border border-[#b8902e]/15  text-[#b8902e]  transition-all duration-300 group-hover:border-[#b8902e]/30 group-hover:bg-[#f8f1df]">
                {item.icon}
              </div>
            </div>
          </div>

          {/* =================================================
              BOTTOM DECORATION
          ================================================= */}

          <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[#b8902e]/10 to-transparent" />
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCard;