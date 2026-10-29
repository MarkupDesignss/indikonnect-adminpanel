import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiActivity,
  FiBell,
  FiCheck,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiGlobe,
  FiLock,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiShield,
  FiSliders,
  FiTool,
  FiX,
  FiEdit3,
} from "react-icons/fi";

import settingsApi, {
  Setting,
  UpdateSettingPayload,
} from "../api/endpoints/settings";
import logoApi from "../api/endpoints/logoApi";
import { usePermissions } from "../pages/permissions/usePermissions";
import PermissionLoadingState from "@/components/common/PermissionLoadingState";

// =====================================================
// BLUE + YELLOW THEME
// =====================================================
const PRIMARY = "#2D6FE8";
const SECONDARY = "#4F8FF7";
const DARK_PRIMARY = "#1E3A8A";
const BLUE_BG = "#EAF3FF";
const SOFT_BLUE = "#F4F8FD";
const CARD_BG = "#F8FBFF";
const BORDER = "#DCE6F2";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4B5563";
const MUTED = "#6B7280";
const YELLOW = "#FACC15";
const YELLOW_BG = "#FEF9C3";
const YELLOW_TEXT = "#A16207";
const WHITE = "#FFFFFF";
const DANGER = "#C23B32";
const DANGER_BG = "#FEF2F2";

const DEFAULT_LOGO_URL =
  "https://www.markupdesigns.net/indikonnect/storage/logos/MmVFOudCiVU3Y8C0sf2gEEXna5jSKroCDj8xYMo0.png";

// =====================================================
// ANIMATION VARIANTS
// =====================================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
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

const AccessDenied: React.FC = () => (
  <div
    className="flex min-h-[60vh] w-full items-center justify-center p-5"
    style={{ backgroundColor: SOFT_BLUE }}
  >
    <div
      className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm"
      style={{ borderColor: BORDER }}
    >
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: DANGER_BG,
          color: DANGER,
        }}
      >
        <FiShield size={25} />
      </div>

      <h2
        className="mt-4 text-lg font-bold"
        style={{ color: TEXT_PRIMARY }}
      >
        Access Denied
      </h2>

      <p
        className="mt-2 text-sm leading-6"
        style={{ color: MUTED }}
      >
        You do not have permission to access Admin Settings.
      </p>

      <div
        className="mt-5 rounded-xl border px-4 py-3 text-xs font-semibold"
        style={{
          borderColor: `${DANGER}25`,
          backgroundColor: DANGER_BG,
          color: DANGER,
        }}
      >
        Contact your administrator to request access.
      </div>
    </div>
  </div>
);

// =====================================================
// SETTINGS GROUP CONFIG
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
    description:
      "Manage return, buy-back and legal business rules.",
    icon: <FiShield size={18} />,
  },
  tax: {
    title: "Tax & GST",
    description:
      "Configure tax, TDS and rounding related settings.",
    icon: <FiDollarSign size={18} />,
  },
  auth: {
    title: "Authentication",
    description:
      "Manage OTP, session and account security settings.",
    icon: <FiLock size={18} />,
  },
  notification: {
    title: "Notifications",
    description:
      "Configure email, SMS and notification behavior.",
    icon: <FiBell size={18} />,
  },
  checkout: {
    title: "Checkout",
    description:
      "Manage payment, invoice and cart configuration.",
    icon: <FiCreditCard size={18} />,
  },
  integration: {
    title: "Integrations",
    description:
      "Manage API timeout, retry and external integrations.",
    icon: <FiActivity size={18} />,
  },
  inventory: {
    title: "Inventory",
    description:
      "Configure global inventory and stock thresholds.",
    icon: <FiPackage size={18} />,
  },
  maintenance: {
    title: "Maintenance",
    description:
      "Manage scheduled maintenance and payout operations.",
    icon: <FiTool size={18} />,
  },
  exchange_rate: {
    title: "Exchange Rate",
    description:
      "Manage currency conversion configuration.",
    icon: <FiGlobe size={18} />,
  },
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================
const getApiErrorMessage = (
  error: any,
  fallback: string
): string => {
  const responseData = error?.response?.data;

  if (
    typeof responseData === "string" &&
    responseData.trim()
  ) {
    return responseData;
  }

  if (
    typeof responseData?.message === "string" &&
    responseData.message
  ) {
    return responseData.message;
  }

  if (
    typeof responseData?.error === "string" &&
    responseData.error
  ) {
    return responseData.error;
  }

  return error?.message || fallback;
};

const formatKey = (key: string): string =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getSettingUnit = (setting: Setting): string => {
  const key = setting.key.toLowerCase();

  if (key.includes("days")) return "days";
  if (key.includes("minutes")) return "min";
  if (key.includes("seconds")) return "sec";
  if (key.includes("percent")) return "%";
  if (key.includes("amount")) return "₹";

  if (
    key.includes("rate") ||
    key.includes("limit") ||
    key.includes("count")
  ) {
    return "";
  }

  return "";
};

const normalizeBoolean = (
  value: string | boolean
): boolean =>
  value === true ||
  String(value).toLowerCase() === "true" ||
  String(value) === "1";

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
// SETTING ROW PROPS
// =====================================================
interface SettingRowProps {
  setting: Setting;
  value: string;
  saving: boolean;
  canSave: boolean;
  isDirty: boolean;
  onChange: (key: string, value: string) => void;
  onUpdate: (setting: Setting) => void;
}

// =====================================================
// SETTING ROW
// =====================================================
const SettingRow: React.FC<SettingRowProps> = ({
  setting,
  value,
  saving,
  canSave,
  isDirty,
  onChange,
  onUpdate,
}) => {
  const unit = getSettingUnit(setting);
  const label = formatKey(setting.key);
  const isBoolean = setting.data_type === "boolean";
  const booleanValue = normalizeBoolean(value);
  const readOnly = !setting.is_editable || !canSave;

  // Handle input change with validation for integer types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (setting.data_type === "integer") {
      // 1. Remove any character that is not a digit
      val = val.replace(/[^0-9]/g, "");
      
      // 2. Ensure it does not start with multiple zeros
      if (val.length > 1 && val.startsWith("0")) {
        val = val.replace(/^0+/, "");
      }
    }

    onChange(setting.key, val);
  };

  return (
    <motion.div
      variants={itemVariants}
      className="group rounded-2xl border bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(45,111,232,0.07)] sm:p-5"
      style={{ borderColor: BORDER }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="text-[14px] font-bold"
              style={{ color: TEXT_PRIMARY }}
            >
              {label}
            </h3>

            <span
              className="rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{
                backgroundColor: BLUE_BG,
                color: DARK_PRIMARY,
              }}
            >
              {setting.data_type}
            </span>

            {readOnly && (
              <span
                className="rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em]"
                style={{
                  backgroundColor: YELLOW_BG,
                  color: YELLOW_TEXT,
                }}
              >
                View Only
              </span>
            )}
          </div>

          <p
            className="mt-1.5 max-w-2xl text-xs leading-5"
            style={{ color: MUTED }}
          >
            {setting.description || "No description available."}
          </p>

          <p
            className="mt-2 text-[10px] font-medium"
            style={{ color: MUTED }}
          >
            Key:{" "}
            <span
              className="font-semibold"
              style={{ color: TEXT_SECONDARY }}
            >
              {setting.key}
            </span>
          </p>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 lg:w-auto">
          {isBoolean ? (
            <button
              type="button"
              disabled={readOnly || saving}
              onClick={() =>
                onChange(
                  setting.key,
                  booleanValue ? "false" : "true"
                )
              }
              aria-label={`${label}: ${
                booleanValue ? "On" : "Off"
              }`}
              className={`relative h-11 w-[82px] shrink-0 rounded-full border p-1 transition-all duration-200 ${
                readOnly || saving
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer"
              }`}
              style={{
                borderColor: booleanValue ? "#BFD7FF" : BORDER,
                backgroundColor: booleanValue
                  ? BLUE_BG
                  : CARD_BG,
              }}
            >
              <span
                className="absolute top-1 flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-all duration-200"
                style={{
                  left: booleanValue ? "40px" : "4px",
                  backgroundColor: booleanValue
                    ? PRIMARY
                    : WHITE,
                  color: booleanValue ? WHITE : MUTED,
                }}
              >
                {booleanValue ? (
                  <FiCheck size={15} />
                ) : (
                  <FiX size={15} />
                )}
              </span>

              <span
                className="absolute top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide"
                style={{
                  left: booleanValue ? "12px" : undefined,
                  right: booleanValue ? undefined : "10px",
                  color: booleanValue ? DARK_PRIMARY : MUTED,
                }}
              >
                {booleanValue ? "ON" : "OFF"}
              </span>
            </button>
          ) : (
            <div className="relative w-full lg:w-[245px]">
              <input
                /* Type text to hide default number spinner arrows */
                type={
                  setting.data_type === "email" ? "email" : "text"
                }
                inputMode={
                  setting.data_type === "integer" ? "numeric" : "text"
                }
                value={value}
                onChange={handleInputChange}
                disabled={readOnly || saving}
                className="h-11 w-full rounded-xl border px-3.5 pr-12 text-sm font-medium outline-none transition-all placeholder:text-[#9CA3AF] focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60"
                style={
                  {
                    borderColor: BORDER,
                    backgroundColor:
                      readOnly || saving
                        ? "#F1F5F9"
                        : SOFT_BLUE,
                    color: TEXT_PRIMARY,
                    outlineColor: PRIMARY,
                    "--tw-ring-color": BLUE_BG,
                  } as React.CSSProperties
                }
              />

              {unit && (
                <span
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold"
                  style={{ color: MUTED }}
                >
                  {unit}
                </span>
              )}
            </div>
          )}

          {/* UPDATE BUTTON LOGIC */}
          {canSave && setting.is_editable ? (
            isDirty ? (
              <button
                type="button"
                onClick={() => onUpdate(setting)}
                disabled={saving}
                className="flex h-11 px-4 items-center justify-center gap-2 rounded-xl text-white text-sm font-semibold shadow-[0_5px_15px_rgba(45,111,232,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(45,111,232,0.25)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${SECONDARY}, ${PRIMARY}, ${DARK_PRIMARY})`,
                }}
                title="Update setting"
              >
                {saving ? (
                  <FiRefreshCw size={16} className="animate-spin" />
                ) : (
                  <FiEdit3 size={16} />
                )}
                <span>Update</span>
              </button>
            ) : (
              <div className="flex h-11 shrink-0 items-center justify-center px-2">
                 {/* Blank space when not dirty to prevent layout shift */}
              </div>
            )
          ) : (
            <div
              className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-[10px] font-semibold"
              style={{
                borderColor: BORDER,
                backgroundColor: CARD_BG,
                color: MUTED,
              }}
              title="You have view-only access"
            >
              <FiLock size={12} />
              Read Only
            </div>
          )}
        </div>
      </div>

      <div
        className="mt-4 flex items-center gap-2 border-t pt-3"
        style={{ borderColor: "#EDF2F8" }}
      >
        <FiClock size={11} style={{ color: MUTED }} />

        <span
          className="text-[10px]"
          style={{ color: MUTED }}
        >
          Last updated{" "}
          {setting.updated_at
            ? new Date(setting.updated_at).toLocaleString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )
            : "-"}
        </span>
      </div>
    </motion.div>
  );
};

// =====================================================
// SETTINGS MANAGEMENT
// =====================================================
const SettingsManagement: React.FC = () => {
  const {
    can,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewSettings = useMemo(
    () =>
      isSuperAdmin ||
      can("Admin Settings", "view"),
    [isSuperAdmin, can]
  );

  const canSaveSettings = useMemo(
    () =>
      isSuperAdmin ||
      can("Admin Settings", "save"),
    [isSuperAdmin, can]
  );

  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  
  // Track original values to detect dirty state
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [initialDataLoading, setInitialDataLoading] = useState(true);
  const [logoLoading, setLogoLoading] = useState(true);
  const [loaderLogoUrl, setLoaderLogoUrl] = useState<string>(DEFAULT_LOGO_URL);

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");

  const initialFetchStartedRef = useRef(false);
  const fetchInFlightRef = useRef<Promise<void> | null>(null);

  // =====================================================
  // FETCH LOGO FOR LOADER
  // =====================================================
  useEffect(() => {
    let isMounted = true;

    const fetchLoaderLogo = async () => {
      try {
        const response = await logoApi.getLogo();
        const responseData = response?.data as any;

        const receivedLogo =
          responseData?.data?.logo ||
          responseData?.logo ||
          responseData?.data?.data?.logo ||
          responseData?.data?.data?.data?.logo;

        if (isMounted) {
          setLoaderLogoUrl(
            typeof receivedLogo === "string" &&
              receivedLogo.trim()
              ? receivedLogo
              : DEFAULT_LOGO_URL
          );
        }
      } catch (error) {
        if (isMounted) {
          setLoaderLogoUrl(DEFAULT_LOGO_URL);
        }
      } finally {
        if (isMounted) {
          setLogoLoading(false);
        }
      }
    };

    void fetchLoaderLogo();

    return () => {
      isMounted = false;
    };
  }, []);

  // =====================================================
  // FETCH SETTINGS
  // =====================================================
  const fetchSettings = useCallback(
    async (isInitialLoad = false) => {
      if (!canViewSettings) {
        if (isInitialLoad) {
          setInitialDataLoading(false);
        }
        return;
      }

      if (fetchInFlightRef.current) {
        await fetchInFlightRef.current;

        if (isInitialLoad) {
          setInitialDataLoading(false);
        }

        return;
      }

      const request: Promise<void> = (async () => {
        try {
          setLoading(true);

          const response = await settingsApi.getAll();

          if (response.data.success) {
            const list: Setting[] = Array.isArray(
              response.data.data
            )
              ? response.data.data
              : [];

            setSettings(list);

            const initialValues: Record<string, string> = {};

            list.forEach((setting) => {
              initialValues[setting.key] = String(
                setting.value ?? ""
              );
            });

            setValues(initialValues);
            setOriginalValues(initialValues); // Store originals for dirty check
          } else {
            toast.error(
              response.data.message ||
                "Unable to fetch settings."
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
          fetchInFlightRef.current = null;

          if (isInitialLoad) {
            setInitialDataLoading(false);
          }
        }
      })();

      fetchInFlightRef.current = request;

      await request;
    },
    [canViewSettings]
  );

  // =====================================================
  // INITIAL SETTINGS FETCH AFTER PERMISSIONS
  // =====================================================
  useEffect(() => {
    if (permissionsLoading) return;

    if (!canViewSettings) {
      setInitialDataLoading(false);
      return;
    }

    if (initialFetchStartedRef.current) return;

    initialFetchStartedRef.current = true;

    void fetchSettings(true);
  }, [
    permissionsLoading,
    canViewSettings,
    fetchSettings,
  ]);

  const pageLoading =
    permissionsLoading ||
    logoLoading ||
    initialDataLoading;

  // =====================================================
  // SETTINGS GROUPS
  // =====================================================
  const groups = useMemo(
    () =>
      Array.from(
        new Set(settings.map((setting) => setting.group))
      ),
    [settings]
  );

  // =====================================================
  // FILTER SETTINGS
  // =====================================================
  const filteredSettings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return settings.filter((setting) => {
      const matchesGroup =
        activeGroup === "all" ||
        setting.group === activeGroup;

      if (!matchesGroup) return false;
      if (!query) return true;

      return (
        setting.key.toLowerCase().includes(query) ||
        setting.group.toLowerCase().includes(query) ||
        setting.description?.toLowerCase().includes(query) ||
        String(setting.value)
          .toLowerCase()
          .includes(query)
      );
    });
  }, [settings, search, activeGroup]);

  // =====================================================
  // GROUP FILTERED SETTINGS
  // =====================================================
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

  // =====================================================
  // HANDLE SETTING CHANGE
  // =====================================================
  const handleValueChange = (
    key: string,
    value: string
  ) => {
    if (!canSaveSettings) {
      toast.error(
        "You do not have permission to edit settings."
      );
      return;
    }

    setValues((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // =====================================================
  // UPDATE SETTING (Direct API Call & Refetch)
  // =====================================================
  const handleUpdate = async (setting: Setting) => {
    if (!canSaveSettings) {
      toast.error(
        "You do not have permission to save settings."
      );
      return;
    }

    if (!setting.is_editable) {
      toast.error("This setting cannot be edited.");
      return;
    }

    const currentValue = values[setting.key] ?? "";

    // Validations
    if (
      setting.data_type !== "boolean" &&
      currentValue.trim() === ""
    ) {
      toast.error(
        `${formatKey(setting.key)} cannot be empty.`
      );
      return;
    }

    if (setting.data_type === "integer") {
      if (!Number.isInteger(Number(currentValue))) {
        toast.error(
          `${formatKey(setting.key)} must be a valid integer.`
        );
        return;
      }
      
      // Ensure value is not negative
      if (Number(currentValue) < 0) {
        toast.error(
          `${formatKey(setting.key)} must be 0 or greater.`
        );
        return;
      }
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
          `${formatKey(setting.key)} must be between 0 and 100.`
        );
        return;
      }
    }

    if (setting.key === "payout_period_close_day") {
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
            `${formatKey(setting.key)} updated successfully.`
        );

        // Auto Recall GET API to fetch fresh data
        await fetchSettings();
        
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

  // =====================================================
  // INITIAL LOADING / PERMISSION CHECK
  // =====================================================
  if (
    pageLoading ||
    (loading && settings.length === 0)
  ) {
    return <PermissionLoadingState logoUrl={loaderLogoUrl} />;
  }

  if (!canViewSettings) {
    return <AccessDenied />;
  }

  // =====================================================
  // MAIN SETTINGS UI
  // =====================================================
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(850px 380px at 100% -5%, rgba(250,204,21,0.12), transparent), radial-gradient(850px 420px at -5% 0%, rgba(45,111,232,0.09), transparent), linear-gradient(180deg, #FFFFFF 0%, #F4F8FD 100%)",
      }}
    >
      <div className="mx-auto max-w-[1500px]">
        {/* PAGE HEADER */}
        <motion.div
          variants={itemVariants}
          className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: YELLOW }}
              />

              <span
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: PRIMARY }}
              >
                System Configuration
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: BLUE_BG,
                  color: PRIMARY,
                }}
              >
                <FiSettings size={21} />
              </div>

              <div>
                <h1 className="text-[20px] font-medium tracking-tight text-[#111827] sm:text-[22px]">
                  Settings
                </h1>

                <p className="mt-0.5 text-sm text-[#111827]">
                  Manage application-wide business and system
                  configuration.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-2.5"
              style={{ borderColor: BORDER }}
            >
              <p
                className="text-[9px] font-bold uppercase tracking-[0.15em]"
                style={{ color: MUTED }}
              >
                Total Settings
              </p>

              <p
                className="text-lg font-bold"
                style={{ color: DARK_PRIMARY }}
              >
                {settings.length}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchSettings()}
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: BORDER,
                color: PRIMARY,
              }}
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>
          </div>
        </motion.div>

        {/* SETTINGS CARD */}
        <motion.div
          variants={itemVariants}
          className="overflow-hidden rounded-2xl border bg-white shadow-[0_8px_35px_rgba(45,111,232,0.06)]"
          style={{ borderColor: BORDER }}
        >
          {/* CARD HEADER */}
          <div
            className="border-b bg-white p-5 sm:p-6"
            style={{ borderColor: BORDER }}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FiSliders
                    size={16}
                    style={{ color: PRIMARY }}
                  />

                  <h2
                    className="text-[15px] font-bold"
                    style={{ color: TEXT_PRIMARY }}
                  >
                    Application Settings
                  </h2>

                  {!canSaveSettings && (
                    <span
                      className="rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: YELLOW_BG,
                        color: YELLOW_TEXT,
                      }}
                    >
                      View Only
                    </span>
                  )}
                </div>

                <p
                  className="mt-1 text-xs"
                  style={{ color: MUTED }}
                >
                  Configure legal, tax, authentication,
                  checkout and integration rules.
                </p>
              </div>

              {/* SEARCH */}
              <div className="relative w-full xl:max-w-sm">
                <FiSearch
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: MUTED }}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search settings..."
                  className="h-11 w-full rounded-xl border py-2 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-[#9CA3AF] focus:bg-white focus:ring-4"
                  style={
                    {
                      borderColor: BORDER,
                      backgroundColor: SOFT_BLUE,
                      color: TEXT_PRIMARY,
                      "--tw-ring-color": BLUE_BG,
                    } as React.CSSProperties
                  }
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 flex -translate-y-1/2 transition-colors"
                    style={{ color: MUTED }}
                    aria-label="Clear search"
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* GROUP FILTERS */}
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveGroup("all")}
                className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200"
                style={
                  activeGroup === "all"
                    ? {
                        background: `linear-gradient(135deg, ${SECONDARY}, ${PRIMARY})`,
                        color: WHITE,
                        boxShadow:
                          "0 5px 14px rgba(45,111,232,0.2)",
                      }
                    : {
                        border: `1px solid ${BORDER}`,
                        backgroundColor: WHITE,
                        color: TEXT_SECONDARY,
                      }
                }
              >
                All Settings
              </button>

              {groups.map((group) => {
                const config = GROUP_CONFIG[group];
                const active = activeGroup === group;

                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setActiveGroup(group)}
                    className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200"
                    style={
                      active
                        ? {
                            background: `linear-gradient(135deg, ${SECONDARY}, ${PRIMARY})`,
                            color: WHITE,
                            boxShadow:
                              "0 5px 14px rgba(45,111,232,0.2)",
                          }
                        : {
                            border: `1px solid ${BORDER}`,
                            backgroundColor: WHITE,
                            color: TEXT_SECONDARY,
                          }
                    }
                  >
                    {config?.title || formatKey(group)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SETTINGS CONTENT */}
          <div className="p-5 sm:p-6">
            {filteredSettings.length === 0 ? (
              <div className="px-5 py-20 text-center">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: BLUE_BG,
                    color: PRIMARY,
                  }}
                >
                  <FiSearch size={25} />
                </div>

                <h3
                  className="mt-5 text-base font-bold"
                  style={{ color: TEXT_PRIMARY }}
                >
                  No settings found
                </h3>

                <p
                  className="mx-auto mt-2 max-w-sm text-sm leading-6"
                  style={{ color: MUTED }}
                >
                  Try searching with another keyword or select
                  a different settings group.
                </p>

                {(search || activeGroup !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setActiveGroup("all");
                    }}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                    style={{
                      background: `linear-gradient(135deg, ${SECONDARY}, ${PRIMARY})`,
                    }}
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
                    const config = GROUP_CONFIG[group];

                    return (
                      <section key={group}>
                        <div className="mb-4 flex items-start gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: BLUE_BG,
                              color: PRIMARY,
                            }}
                          >
                            {config?.icon || (
                              <FiSettings size={18} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                className="text-[15px] font-bold"
                                style={{
                                  color: TEXT_PRIMARY,
                                }}
                              >
                                {config?.title ||
                                  formatKey(group)}
                              </h3>

                              <span
                                className="rounded-full px-2 py-1 text-[9px] font-bold"
                                style={{
                                  backgroundColor: YELLOW_BG,
                                  color: YELLOW_TEXT,
                                }}
                              >
                                {groupSettings.length}{" "}
                                {groupSettings.length === 1
                                  ? "setting"
                                  : "settings"}
                              </span>
                            </div>

                            <p
                              className="mt-1 text-xs"
                              style={{ color: MUTED }}
                            >
                              {config?.description ||
                                `Manage ${formatKey(
                                  group
                                ).toLowerCase()} settings.`}
                            </p>
                          </div>
                        </div>

                        <motion.div
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                          className="space-y-3"
                        >
                          {groupSettings.map((setting) => {
                            // Check if value is changed from original
                            const isDirty = values[setting.key] !== originalValues[setting.key];

                            return (
                              <SettingRow
                                key={setting.id}
                                setting={setting}
                                value={values[setting.key] ?? ""}
                                saving={savingKey === setting.key}
                                canSave={canSaveSettings}
                                isDirty={isDirty}
                                onChange={handleValueChange}
                                onUpdate={handleUpdate}
                              />
                            );
                          })}
                        </motion.div>
                      </section>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* CARD FOOTER */}
          <div
            className="flex flex-col gap-2 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            style={{
              borderColor: BORDER,
              backgroundColor: CARD_BG,
            }}
          >
            <div className="flex items-center gap-2">
              <FiLock
                size={13}
                style={{ color: PRIMARY }}
              />

              <p
                className="text-[11px]"
                style={{ color: MUTED }}
              >
                {canSaveSettings
                  ? "You can update settings allowed by the system."
                  : "You have view-only access. Saving settings is disabled."}
              </p>
            </div>

            <p
              className="text-[11px] font-medium"
              style={{ color: MUTED }}
            >
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