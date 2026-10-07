import React from "react";
import { FiUploadCloud, FiClock, FiZap } from "react-icons/fi";

export interface UploadProgressBarProps {
    percent: number;
    loaded: number;
    total: number;
    bytesPerSecond: number;
    estimatedRemainingMs: number | null;
    label?: string;
}

const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDuration = (ms: number | null) => {
    if (ms === null || !isFinite(ms) || ms <= 0) return "--";
    const totalSec = Math.round(ms / 1000);
    if (totalSec < 1) return "<1s";
    if (totalSec < 60) return `${totalSec}s`;
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}m ${sec}s`;
};

const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
    percent,
    loaded,
    total,
    bytesPerSecond,
    estimatedRemainingMs,
    label = "Uploading image…",
}) => {
    const isDone = percent >= 100;

    return (
        <div className="mt-3 rounded-xl border border-[#D8E2D8] bg-[#F5F7F5] p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#163F20]">
                <span className="flex items-center gap-1.5">
                    <FiUploadCloud size={13} />
                    {isDone ? "Upload complete, processing…" : label}
                </span>
                <span>{percent}%</span>
            </div>

            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E5EAE5]">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-[#4C8A57] to-[#163F20] transition-all duration-200 ease-out"
                    style={{ width: `${percent}%` }}
                />
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#59645C]">
                <span>
                    {formatBytes(loaded)} / {formatBytes(total)}
                </span>

                <span className="flex items-center gap-1">
                    <FiZap size={10} />
                    {formatBytes(bytesPerSecond)}/s
                </span>

                <span className="flex items-center gap-1">
                    <FiClock size={10} />
                    {isDone
                        ? "Finalizing…"
                        : `${formatDuration(estimatedRemainingMs)} left`}
                </span>
            </div>
        </div>
    );
};

export default UploadProgressBar;