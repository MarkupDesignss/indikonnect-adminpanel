import React from "react";
import { motion } from "framer-motion";

interface StatItem {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  barColor?: string;
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
      <div className={`grid gap-4 ${gridCols} ${className}`}>
        {[1, 2, 3, 4].map((item) => (
          <motion.div
            key={item}
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="relative min-h-[130px] overflow-hidden rounded-2xl border border-[#b8902e]/12 bg-white px-5 py-5 shadow-[0_4px_14px_rgba(70,55,20,0.025)]"
          >
            {/* Gold Accent */}
            <div
              className={`absolute left-0 top-0 h-1 w-full ${defaultGradient}`}
            />

            {/* Decorative Circles */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#d4af52]/15" />

            <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full border border-[#b8902e]/8" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="w-full">
                <div className="h-2.5 w-28 animate-pulse rounded-full bg-[#eee8da]" />

                <div className="mt-4 h-8 w-20 animate-pulse rounded-lg bg-[#f3efe6]" />

                <div className="mt-3 h-2 w-20 animate-pulse rounded-full bg-[#eee8da]" />
              </div>

              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-[#f3efe6]" />
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
    <div className={`grid gap-4 ${gridCols} ${className}`}>
      {stats.map((item, index) => (
        <motion.div
          key={`${item.title}-${index}`}
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: index * 0.05,
            type: "spring",
            stiffness: 120,
            damping: 16,
          }}
          whileHover={{
            y: -2,
            boxShadow: "0 10px 24px -18px rgba(140,105,25,0.25)",
          }}
          className="group relative min-h-[130px] overflow-hidden rounded-2xl border border-[#b8902e]/12 bg-white px-5 py-5 shadow-[0_4px_14px_rgba(70,55,20,0.025)] transition-all duration-300 hover:border-[#b8902e]/20"
        >
          {/* =================================================
              TOP GOLD ACCENT
          ================================================= */}

          <div
            className={`absolute left-0 top-0 h-1 w-full ${
              item.barColor || defaultGradient
            }`}
          />

          {/* Small glow */}
          <div className="absolute left-0 top-0 h-10 w-10 bg-gradient-to-br from-[#d4af52]/4 to-transparent blur-lg" />

          {/* =================================================
              DECORATIVE ELEMENTS
          ================================================= */}

          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#d4af52]/14 transition-transform duration-500 group-hover:scale-105" />

          <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full border border-[#b8902e]/8" />

          <div className="pointer-events-none absolute right-7 top-7 h-2 w-2 rounded-full bg-[#d4af52]/25" />

          <div className="pointer-events-none absolute -right-8 top-8 h-20 w-20 rounded-full bg-[#d4af52]/4 blur-2xl" />

          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Title */}

              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]/80" />

                <p className="font-lato text-[10px] font-semibold uppercase tracking-[0.13em] text-[#a89a7d]">
                  {item.title}
                </p>
              </div>

              {/* Value */}

              <motion.h2
                initial={{
                  opacity: 0,
                  scale: 0.96,
                  y: 3,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.05 + 0.1,
                  type: "spring",
                  stiffness: 180,
                  damping: 17,
                }}
                className="mt-2.5 font-lato text-[28px] font-bold leading-none tracking-[-1px] text-[#29251f]"
              >
                {item.value}
              </motion.h2>

              {/* Subtitle / Trend */}

              <div className="mt-3 flex items-center gap-2">
                {item.trend ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                      item.trend.isPositive
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {item.trend.isPositive ? "↑" : "↓"}
                    {Math.abs(item.trend.value)}%
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b8902e]/70" />
                )}

                <span className="text-[10px] font-normal text-[#a89a7d]">
                  {item.subtitle || "Overview"}
                </span>
              </div>
            </div>

            {/* =================================================
                ICON BOX - THINNER / LIGHTER
            ================================================= */}

            <div className="relative shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#b8902e]/10 bg-[#faf8f3] text-[#b8902e]/85 shadow-[0_2px_6px_rgba(70,55,20,0.025)] transition-all duration-300 group-hover:border-[#b8902e]/20 group-hover:bg-[#f8f1df] group-hover:shadow-[0_4px_10px_rgba(70,55,20,0.05)] group-hover:scale-[1.03]">
                <div className="scale-[0.88] font-normal transition-transform duration-300 group-hover:scale-95">
                  {item.icon}
                </div>
              </div>

              {/* Shine */}
              <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          </div>

          {/* =================================================
              BOTTOM DECORATION
          ================================================= */}

          <div className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[#b8902e]/7 to-transparent" />

          {/* Hover Glow */}
          <div className="absolute -bottom-6 left-1/2 h-12 w-3/4 -translate-x-1/2 rounded-full bg-[#d4af52]/4 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCard;