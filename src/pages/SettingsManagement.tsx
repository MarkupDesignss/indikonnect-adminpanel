import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import {
  FiActivity,
  FiBell,
  FiCalendar,
  FiCheck,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiEdit2,
  FiGlobe,
  FiLock,
  FiMail,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiSave,
  FiSettings,
  FiShield,
  FiSliders,
  FiTool,
  FiTruck,
  FiUserCheck,
  FiX,
} from "react-icons/fi";

import settingsApi, {
  Setting,
  UpdateSettingPayload,
} from "../api/endpoints/settings";

// =====================================================
// CONSTANTS
// =====================================================

const PAGE_BG = "#F5F7F5";

const containerVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 8,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 18,
    },
  },
};

// =====================================================
// GROUP CONFIG
// =====================================================

const GROUP_CONFIG: Record<
  string,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
  }
> = {
  legal: {
    title: "Legal & Policy",
    description: "Manage return, buy-back and legal business rules.",
    icon: <FiShield size={18} />,
  },

  tax: {
    title: "Tax & GST",
    description: "Configure tax, TDS and rounding related settings.",
    icon: <FiDollarSign size={18} />,
  },

  auth: {
    title: "Authentication",
    description: "Manage OTP, session and account security settings.",
    icon: <FiLock size={18} />,
  },

  notification: {
    title: "Notifications",
    description: "Configure email, SMS and notification behavior.",
    icon: <FiBell size={18} />,
  },

  checkout: {
    title: "Checkout",
    description: "Manage payment, invoice and cart configuration.",
    icon: <FiCreditCard size={18} />,
  },

  integration: {
    title: "Integrations",
    description: "Manage API timeout, retry and external integrations.",
    icon: <FiActivity size={18} />,
  },

  inventory: {
    title: "Inventory",
    description: "Configure global inventory and stock thresholds.",
    icon: <FiPackage size={18} />,
  },

  maintenance: {
    title: "Maintenance",
    description: "Manage scheduled maintenance and payout operations.",
    icon: <FiTool size={18} />,
  },

  exchange_rate: {
    title: "Exchange Rate",
    description: "Manage currency conversion configuration.",
    icon: <FiGlobe size={18} />,
  },
};

// =====================================================
// HELPERS
// =====================================================

const getApiErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (
    responseData?.message &&
    typeof responseData.message === "string"
  ) {
    return responseData.message;
  }

  if (
    responseData?.error &&
    typeof responseData.error === "string"
  ) {
    return responseData.error;
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

const formatKey = (key: string) => {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getSettingUnit = (setting: Setting) => {
  const key = setting.key.toLowerCase();

  if (key.includes("days")) return "days";
  if (key.includes("minutes")) return "min";
  if (key.includes("seconds")) return "sec";
  if (key.includes("percent")) return "%";
  if (key.includes("amount")) return "₹";
  if (key.includes("rate")) return "";
  if (key.includes("limit")) return "";
  if (key.includes("count")) return "";

  return "";
};

const normalizeBoolean = (value: string | boolean) => {
  return (
    value === true ||
    String(value).toLowerCase() === "true" ||
    String(value) === "1"
  );
};

const parseValueForSubmit = (
  setting: Setting,
  value: string
): string | number | boolean => {
  switch (setting.data_type) {
    case "integer":
      return Number(value);

    case "boolean":
      return normalizeBoolean(value);

    case "string":
    case "email":
    default:
      return value;
  }
};

// =====================================================
// SETTING FIELD
// =====================================================

interface SettingRowProps {
  setting: Setting;
  value: string;
  saving: boolean;
  onChange: (key: string, value: string) => void;
  onSave: (setting: Setting) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({
  setting,
  value,
  saving,
  onChange,
  onSave,
}) => {
  const unit = getSettingUnit(setting);
  const label = formatKey(setting.key);

  const isBoolean = setting.data_type === "boolean";
  const booleanValue = normalizeBoolean(value);

  return (
    <motion.div
      variants={itemVariants}
      className="
        group
        rounded-2xl
        border border-[#E3E8E3]
        bg-white
        p-4 sm:p-5
        transition-all duration-200
        hover:border-[#C8D6C9]
        hover:shadow-[0_8px_25px_rgba(22,63,32,0.05)]
      "
    >
      {/* TOP */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* INFO */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#182019]">
              {label}
            </h3>

            <span
              className="
                rounded-full
                bg-[#F0F4F0]
                px-2 py-1
                text-[9px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-[#68726A]
              "
            >
              {setting.data_type}
            </span>

            {!setting.is_editable && (
              <span
                className="
                  rounded-full
                  bg-[#F5F5F5]
                  px-2 py-1
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.12em]
                  text-[#8A8F8B]
                "
              >
                Read Only
              </span>
            )}
          </div>

          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#7A847C]">
            {setting.description || "No description available."}
          </p>

          <p className="mt-2 text-[10px] font-medium text-[#A0A8A1]">
            Key:{" "}
            <span className="font-semibold text-[#68726A]">
              {setting.key}
            </span>
          </p>
        </div>

        {/* FIELD + SAVE */}
        <div className="flex w-full shrink-0 items-center gap-2 lg:w-auto">
          {isBoolean ? (
            <button
              type="button"
              disabled={!setting.is_editable || saving}
              onClick={() =>
                onChange(
                  setting.key,
                  booleanValue ? "false" : "true"
                )
              }
              className={`
                relative
                h-11
                w-[82px]
                shrink-0
                rounded-full
                border
                p-1
                transition-all duration-200
                ${
                  booleanValue
                    ? "border-[#A7C3AA] bg-[#EAF3EA]"
                    : "border-[#DDE3DE] bg-[#F2F4F2]"
                }
                ${
                  !setting.is_editable
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }
              `}
            >
              <span
                className={`
                  absolute
                  top-1
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  shadow-sm
                  transition-all duration-200
                  ${
                    booleanValue
                      ? "left-[40px] bg-[#163F20] text-white"
                      : "left-1 bg-white text-[#788279]"
                  }
                `}
              >
                {booleanValue ? (
                  <FiCheck size={15} />
                ) : (
                  <FiX size={15} />
                )}
              </span>

              <span
                className={`
                  absolute
                  top-1/2
                  -translate-y-1/2
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wide
                  ${
                    booleanValue
                      ? "left-3 text-[#4C8A57]"
                      : "right-2.5 text-[#8A948C]"
                  }
                `}
              >
                {booleanValue ? "ON" : "OFF"}
              </span>
            </button>
          ) : (
            <div className="relative w-full lg:w-[245px]">
              <input
                type={
                  setting.data_type === "email"
                    ? "email"
                    : setting.data_type === "integer"
                      ? "number"
                      : "text"
                }
                value={value}
                onChange={(event) =>
                  onChange(setting.key, event.target.value)
                }
                disabled={!setting.is_editable || saving}
                step={
                  setting.data_type === "integer"
                    ? "1"
                    : undefined
                }
                className="
                  h-11
                  w-full
                  rounded-xl
                  border border-[#DDE4DE]
                  bg-[#FAFCFA]
                  px-3.5
                  pr-12
                  text-sm
                  font-medium
                  text-[#182019]
                  outline-none
                  transition-all duration-200
                  placeholder:text-[#A0A8A1]
                  focus:border-[#4C8A57]
                  focus:bg-white
                  focus:ring-4
                  focus:ring-[#EAF3EA]
                  disabled:cursor-not-allowed
                  disabled:bg-[#F3F5F3]
                  disabled:text-[#889189]
                "
              />

              {unit && (
                <span
                  className="
                    absolute
                    right-3.5
                    top-1/2
                    -translate-y-1/2
                    text-[11px]
                    font-bold
                    text-[#7C887E]
                  "
                >
                  {unit}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => onSave(setting)}
            disabled={!setting.is_editable || saving}
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[#163F20]
              text-white
              shadow-[0_5px_15px_rgba(22,63,32,0.14)]
              transition-all duration-200
              hover:-translate-y-0.5
              hover:bg-[#0F3219]
              hover:shadow-[0_8px_18px_rgba(22,63,32,0.2)]
              active:translate-y-0
              disabled:cursor-not-allowed
              disabled:bg-[#CBD2CC]
              disabled:shadow-none
            "
            title={
              setting.is_editable
                ? "Save setting"
                : "This setting is read only"
            }
          >
            {saving ? (
              <FiRefreshCw
                size={16}
                className="animate-spin"
              />
            ) : (
              <FiSave size={16} />
            )}
          </button>
        </div>
      </div>

      {/* UPDATED */}
      <div className="mt-4 flex items-center gap-2 border-t border-[#EEF1EE] pt-3">
        <FiClock size={11} className="text-[#9AA49C]" />

        <span className="text-[10px] text-[#9AA49C]">
          Last updated{" "}
          {new Date(setting.updated_at).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const SettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");

  // ===================================================
  // FETCH
  // ===================================================

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await settingsApi.getAll();

      if (response.data.success) {
        const list = response.data.data || [];

        setSettings(list);

        const initialValues: Record<string, string> = {};

        list.forEach((setting) => {
          initialValues[setting.key] = String(setting.value ?? "");
        });

        setValues(initialValues);
      } else {
        toast.error(
          response.data.message || "Unable to fetch settings."
        );
      }
    } catch (error: any) {
      console.error("Fetch settings error:", error);

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to fetch settings."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL
  // ===================================================

  useEffect(() => {
    fetchSettings();
  }, []);

  // ===================================================
  // GROUPS
  // ===================================================

  const groups = useMemo(() => {
    return Array.from(
      new Set(settings.map((setting) => setting.group))
    );
  }, [settings]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredSettings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return settings.filter((setting) => {
      const matchesGroup =
        activeGroup === "all" ||
        setting.group === activeGroup;

      if (!matchesGroup) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        setting.key.toLowerCase().includes(query) ||
        setting.group.toLowerCase().includes(query) ||
        setting.description
          ?.toLowerCase()
          .includes(query) ||
        String(setting.value)
          .toLowerCase()
          .includes(query)
      );
    });
  }, [settings, search, activeGroup]);

  // ===================================================
  // GROUPED SETTINGS
  // ===================================================

  const groupedSettings = useMemo(() => {
    const grouped: Record<string, Setting[]> = {};

    filteredSettings.forEach((setting) => {
      if (!grouped[setting.group]) {
        grouped[setting.group] = [];
      }

      grouped[setting.group].push(setting);
    });

    return grouped;
  }, [filteredSettings]);

  // ===================================================
  // CHANGE
  // ===================================================

  const handleValueChange = (
    key: string,
    value: string
  ) => {
    setValues((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // ===================================================
  // SAVE
  // ===================================================

  const handleSave = async (setting: Setting) => {
    if (!setting.is_editable) {
      return;
    }

    const currentValue = values[setting.key] ?? "";

    if (
      setting.data_type !== "boolean" &&
      currentValue.trim() === ""
    ) {
      toast.error(`${formatKey(setting.key)} cannot be empty.`);
      return;
    }

    if (
      setting.data_type === "integer" &&
      !Number.isInteger(Number(currentValue))
    ) {
      toast.error(
        `${formatKey(setting.key)} must be a valid integer.`
      );
      return;
    }

    if (
      setting.data_type === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        currentValue.trim()
      )
    ) {
      toast.error(
        `${formatKey(setting.key)} must be a valid email.`
      );
      return;
    }

    if (
      setting.key === "buyback_deduction_percent" ||
      setting.key === "tds_rate_percent"
    ) {
      const numberValue = Number(currentValue);

      if (
        Number.isNaN(numberValue) ||
        numberValue < 0 ||
        numberValue > 100
      ) {
        toast.error(
          `${formatKey(
            setting.key
          )} must be between 0 and 100.`
        );
        return;
      }
    }

    if (
      setting.key === "payout_period_close_day"
    ) {
      const day = Number(currentValue);

      if (
        Number.isNaN(day) ||
        day < 1 ||
        day > 31
      ) {
        toast.error(
          "Payout period close day must be between 1 and 31."
        );
        return;
      }
    }

    try {
      setSavingKey(setting.key);

      const payload: UpdateSettingPayload = {
        value: parseValueForSubmit(
          setting,
          currentValue
        ),
        data_type: setting.data_type,
        description: setting.description || "",
      };

      const response = await settingsApi.update(
        setting.key,
        payload
      );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            `${formatKey(
              setting.key
            )} updated successfully.`
        );

        // Update local timestamp/value if API returns updated record
        if (response.data.data) {
          const updatedSetting = response.data.data;

          setSettings((previous) =>
            previous.map((item) =>
              item.key === setting.key
                ? {
                    ...item,
                    ...updatedSetting,
                  }
                : item
            )
          );

          setValues((previous) => ({
            ...previous,
            [setting.key]: String(
              updatedSetting.value ?? currentValue
            ),
          }));
        } else {
          // Refresh everything if API doesn't return object
          await fetchSettings();
        }
      } else {
        toast.error(
          response.data.message ||
            "Unable to update setting."
        );
      }
    } catch (error: any) {
      console.error("Update setting error:", error);

      toast.error(
        getApiErrorMessage(
          error,
          "Something went wrong while updating setting."
        )
      );
    } finally {
      setSavingKey(null);
    }
  };

  // ===================================================
  // RESET FILTER
  // ===================================================

  const clearSearch = () => {
    setSearch("");
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading && settings.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="text-center">
          <div
            className="
              mx-auto
              h-10
              w-10
              animate-spin
              rounded-full
              border-2
              border-[#DDE5DE]
              border-t-[#163F20]
            "
          />

          <p className="mt-3 text-sm text-[#6B756D]">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
      style={{
        background:
          "linear-gradient(180deg, #F8FAF8 0%, #F5F7F5 48%, #F2F6F2 100%)",
      }}
    >
      <div className="mx-auto max-w-[1500px]">
        {/* ============================================= */}
        {/* HEADER */}
        {/* ============================================= */}

        <motion.div
          variants={itemVariants}
          className="
            mb-7
            flex flex-col
            gap-5
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >
          {/* LEFT */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#163F20]" />

              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.22em]
                  text-[#4C8A57]
                "
              >
                System Configuration
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-11 w-11
                  items-center justify-center
                  rounded-xl
                  bg-[#EAF3EA]
                  text-[#163F20]
                "
              >
                <FiSettings size={21} />
              </div>

              <div>
                <h1
                  className="
                    text-[30px]
                    font-bold
                    tracking-[-0.03em]
                    text-[#182019]
                    sm:text-[34px]
                  "
                >
                  Settings
                </h1>

                <p className="mt-1 text-[13px] text-[#6B756D]">
                  Manage application-wide business and system
                  configuration.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <div
              className="
                rounded-xl
                border border-[#DDE5DE]
                bg-white
                px-4 py-2.5
                shadow-sm
              "
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8A948C]">
                Total Settings
              </p>

              <p className="mt-0.5 text-lg font-bold text-[#163F20]">
                {settings.length}
              </p>
            </div>

            <button
              type="button"
              onClick={fetchSettings}
              disabled={loading}
              className="
                flex h-11
                items-center justify-center gap-2
                rounded-xl
                border border-[#DDE5DE]
                bg-white
                px-4
                text-sm
                font-semibold
                text-[#455048]
                shadow-sm
                transition-all duration-200
                hover:border-[#BFD0C1]
                hover:bg-[#F8FAF8]
                hover:text-[#163F20]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <FiRefreshCw
                size={16}
                className={
                  loading ? "animate-spin" : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>
          </div>
        </motion.div>

        {/* ============================================= */}
        {/* MAIN */}
        {/* ============================================= */}

        <motion.div
          variants={itemVariants}
          className="
            overflow-hidden
            rounded-2xl
            border border-[#E1E7E1]
            bg-white
            shadow-[0_8px_35px_rgba(22,63,32,0.05)]
          "
        >
          {/* =========================================== */}
          {/* TOOLBAR */}
          {/* =========================================== */}

          <div
            className="
              border-b border-[#EEF1EE]
              bg-white
              p-5 sm:p-6
            "
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              {/* TITLE */}
              <div>
                <div className="flex items-center gap-2">
                  <FiSliders
                    size={16}
                    className="text-[#4C8A57]"
                  />

                  <h2 className="text-[15px] font-bold text-[#182019]">
                    Application Settings
                  </h2>
                </div>

                <p className="mt-1 text-xs text-[#7A847C]">
                  Configure legal, tax, authentication,
                  checkout and integration rules.
                </p>
              </div>

              {/* SEARCH */}
              <div className="relative w-full xl:max-w-sm">
                <FiSearch
                  size={17}
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    text-[#8A948C]
                  "
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search settings..."
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border border-[#E1E7E1]
                    bg-[#F8FAF8]
                    pl-10
                    pr-10
                    text-sm
                    text-[#182019]
                    outline-none
                    transition-all duration-200
                    placeholder:text-[#9AA39C]
                    focus:border-[#4C8A57]
                    focus:bg-white
                    focus:ring-4
                    focus:ring-[#EAF3EA]
                  "
                />

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="
                      absolute
                      right-3
                      top-1/2
                      flex
                      -translate-y-1/2
                      text-[#929B94]
                      transition-colors
                      hover:text-[#182019]
                    "
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* ========================================= */}
            {/* FILTER TABS */}
            {/* ========================================= */}

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveGroup("all")}
                className={`
                  shrink-0
                  rounded-full
                  px-4 py-2
                  text-xs
                  font-semibold
                  transition-all duration-200
                  ${
                    activeGroup === "all"
                      ? "bg-[#163F20] text-white shadow-[0_5px_14px_rgba(22,63,32,0.14)]"
                      : "border border-[#E0E6E0] bg-white text-[#657067] hover:border-[#BFD0C1] hover:text-[#163F20]"
                  }
                `}
              >
                All Settings
              </button>

              {groups.map((group) => {
                const config =
                  GROUP_CONFIG[group];

                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() =>
                      setActiveGroup(group)
                    }
                    className={`
                      shrink-0
                      rounded-full
                      px-4 py-2
                      text-xs
                      font-semibold
                      transition-all duration-200
                      ${
                        activeGroup === group
                          ? "bg-[#163F20] text-white shadow-[0_5px_14px_rgba(22,63,32,0.14)]"
                          : "border border-[#E0E6E0] bg-white text-[#657067] hover:border-[#BFD0C1] hover:text-[#163F20]"
                      }
                    `}
                  >
                    {config?.title ||
                      formatKey(group)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =========================================== */}
          {/* CONTENT */}
          {/* =========================================== */}

          <div className="p-5 sm:p-6">
            {filteredSettings.length === 0 ? (
              <div className="px-5 py-20 text-center">
                <div
                  className="
                    mx-auto
                    flex h-16 w-16
                    items-center justify-center
                    rounded-full
                    bg-[#EAF3EA]
                    text-[#163F20]
                  "
                >
                  <FiSearch size={25} />
                </div>

                <h3 className="mt-5 text-base font-bold text-[#182019]">
                  No settings found
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#778178]">
                  Try searching with another keyword or
                  select a different settings group.
                </p>

                {(search ||
                  activeGroup !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setActiveGroup("all");
                    }}
                    className="
                      mt-5
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-[#163F20]
                      px-5 py-2.5
                      text-sm
                      font-semibold
                      text-white
                      transition-all
                      hover:bg-[#0F3219]
                    "
                  >
                    <FiRefreshCw size={15} />
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedSettings).map(
                  ([group, groupSettings]) => {
                    const config =
                      GROUP_CONFIG[group];

                    return (
                      <section key={group}>
                        {/* GROUP HEADER */}
                        <div className="mb-4 flex items-start gap-3">
                          <div
                            className="
                              flex h-10 w-10
                              shrink-0
                              items-center justify-center
                              rounded-xl
                              bg-[#EAF3EA]
                              text-[#163F20]
                            "
                          >
                            {config?.icon || (
                              <FiSettings size={18} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-[15px] font-bold text-[#182019]">
                                {config?.title ||
                                  formatKey(group)}
                              </h3>

                              <span
                                className="
                                  rounded-full
                                  bg-[#F1F5F1]
                                  px-2
                                  py-1
                                  text-[9px]
                                  font-bold
                                  text-[#6D786F]
                                "
                              >
                                {groupSettings.length}{" "}
                                {groupSettings.length === 1
                                  ? "setting"
                                  : "settings"}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-[#7A847C]">
                              {config?.description ||
                                `Manage ${formatKey(
                                  group
                                ).toLowerCase()} settings.`}
                            </p>
                          </div>
                        </div>

                        {/* GROUP ROWS */}
                        <motion.div
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                          className="space-y-3"
                        >
                          {groupSettings.map(
                            (setting) => (
                              <SettingRow
                                key={setting.id}
                                setting={setting}
                                value={
                                  values[
                                    setting.key
                                  ] ?? ""
                                }
                                saving={
                                  savingKey ===
                                  setting.key
                                }
                                onChange={
                                  handleValueChange
                                }
                                onSave={handleSave}
                              />
                            )
                          )}
                        </motion.div>
                      </section>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* =========================================== */}
          {/* FOOTER */}
          {/* =========================================== */}

          <div
            className="
              flex
              flex-col
              gap-2
              border-t border-[#EEF1EE]
              bg-[#FBFCFB]
              px-5 py-4
              sm:flex-row
              sm:items-center
              sm:justify-between
              sm:px-6
            "
          >
            <div className="flex items-center gap-2">
              <FiEdit2
                size={13}
                className="text-[#4C8A57]"
              />

              <p className="text-[11px] text-[#7A847C]">
                Only settings marked as editable can be
                changed.
              </p>
            </div>

            <p className="text-[11px] font-medium text-[#929B94]">
              Showing {filteredSettings.length} of{" "}
              {settings.length} settings
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SettingsManagement;