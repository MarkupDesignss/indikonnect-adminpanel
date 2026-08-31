import React, { useMemo, useState, useEffect } from "react";
import {
  FiSearch,
  FiChevronDown,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiEye,
  FiTruck,
  FiChevronUp,
  FiPackage,
  FiUser,
  FiCalendar,
  FiMapPin,
  FiCheck,
  FiSquare,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";

import {
  orderApi,
  OrderDetailsResponse,
} from "../../api/endpoints/orders";

import GlobalModal from "@/components/common/GlobalModal";
import StatsCard from "@/components/common/StatsCard";

// =====================================================
// PREMIUM THEME
// =====================================================

const THEME = {
  cream: "#faf8f3",
  white: "#ffffff",
  dark: "#2f2a22",
  text: "#2a2620",
  secondary: "#786f60",
  muted: "#a89a7d",
  gold: "#b8902e",
  lightGold: "#d4af52",
  darkGold: "#8f6d1d",
  border: "rgba(184,144,46,0.15)",
  softBorder: "rgba(184,144,46,0.10)",
};

// =====================================================
// CUSTOM STAT ICONS
// =====================================================

const ClipboardIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 4H18C19.1046 4 20 4.89543 20 6V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V6C4 4.89543 4.89543 4 6 4H8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.55228 2 15 2Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M8 13H16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M8 17H12"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const ShoppingBagIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 2L3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6L18 2H6Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M3 6H21"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const CreditCardIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="2"
      y="5"
      width="20"
      height="14"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M2 10H22"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M7 15H10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M9 12L11.5 14.5L16 9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

// =====================================================
// ORDER TYPES
// =====================================================

export interface OrderItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  price: string;
  total: string;
  status: string;
  image?: string;
}

export interface Order {
  id: string;
  sNo: number;
  date: string;
  customer: string;
  customerName: string;
  total: string;
  paymentStatus: string;
  orderStatus: string;
  items?: OrderItem[];
  shippingAddress?: string;
  trackingNumber?: string;
  orderType: string;
  amountPaid: number;
  subtotal: number;
  totalGst: number;
  shippingCharge: number;
  userId: number;
  userEmail: string;
  userPhone: string;
}

// =====================================================
// COMMON MODAL LOADER
// =====================================================

interface ModalLoaderProps {
  message?: string;
  icon?: React.ReactNode;
}

const ModalLoader: React.FC<ModalLoaderProps> = ({
  message = "Loading...",
  icon,
}) => (
  <div className="flex min-h-[230px] flex-col items-center justify-center p-8">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
      {icon || (
        <FiLoader
          size={27}
          className="animate-spin"
        />
      )}
    </div>

    <p className="mt-4 text-sm font-semibold text-[#4a4436]">
      {message}
    </p>

    <p className="mt-1 text-xs text-[#a89a7d]">
      Please wait while the information is loaded.
    </p>
  </div>
);

// =====================================================
// COMMON MODAL ERROR
// =====================================================

interface ModalErrorProps {
  error?: string;
  onClose?: () => void;
  defaultMessage?: string;
}

const ModalError: React.FC<ModalErrorProps> = ({
  error,
  onClose,
  defaultMessage = "Something went wrong",
}) => (
  <div className="flex min-h-[230px] flex-col items-center justify-center p-8 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b46055]/10 text-[#b46055]">
      <FiAlertCircle size={27} />
    </div>

    <p className="mt-4 text-sm font-semibold text-[#b46055]">
      {error || defaultMessage}
    </p>

    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="mt-6 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition hover:from-[#a8841c] hover:to-[#795b14]"
      >
        Close
      </button>
    )}
  </div>
);

// =====================================================
// VIEW ORDER POPUP
// =====================================================

interface ViewOrderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}

const ViewOrderPopup: React.FC<
  ViewOrderPopupProps
> = ({ isOpen, onClose, orderId }) => {
  const [activeTab, setActiveTab] = useState<
    "items" | "details" | "tracking"
  >("items");

  const [orderDetails, setOrderDetails] =
    useState<
      OrderDetailsResponse["data"] | null
    >(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails(orderId);
    }

    if (isOpen) {
      setActiveTab("items");
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async (
    id: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await orderApi.getOrderDetails(id);

      if (response.data.success) {
        setOrderDetails(
          response.data.data
        );
      } else {
        setError(
          response.data.message ||
            "Failed to fetch order details"
        );
      }
    } catch (err) {
      setError(
        "An error occurred while fetching order details"
      );

      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <GlobalModal
        isOpen={isOpen}
        onClose={onClose}
        closeOnOverlayClick={false}
      >
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />
          <ModalLoader message="Loading order details..." />
        </div>
      </GlobalModal>
    );
  }

  if (error || !orderDetails) {
    return (
      <GlobalModal
        isOpen={isOpen}
        onClose={onClose}
        closeOnOverlayClick={false}
      >
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />
          <ModalError
            error={
              error || "Order not found"
            }
            onClose={onClose}
          />
        </div>
      </GlobalModal>
    );
  }

  const {
    user,
    items,
    payment,
    summary,
    delivery_address,
    order_status,
    order_reference,
    order_date,
  } = orderDetails;

  const formatDate = (
    dateStr: string
  ) => {
    if (!dateStr) return "N/A";

    const date = new Date(dateStr);

    return date.toLocaleDateString(
      "en-IN",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const uiItems: OrderItem[] =
    items.map((item) => ({
      id: String(item.line_id),
      productName:
        item.product_name || "N/A",
      sku:
        item.product_code || "N/A",
      quantity: item.quantity,
      price: `₹${item.unit_price.toLocaleString(
        "en-IN"
      )}`,
      total: `₹${item.line_total.toLocaleString(
        "en-IN"
      )}`,
      status:
        item.delivery_status
          .charAt(0)
          .toUpperCase() +
          item.delivery_status.slice(1) ||
        "Pending",
      image:
        item.primary_image || undefined,
    }));

  const totalPayable =
    summary?.total_payable || 0;

  const getStatusBadge = (
    status: string
  ) => {
    switch (status) {
      case "delivered":
      case "partial_delivered":
        return "border-[#b8902e]/25 bg-[#f8f3e5] text-[#8f6d1d]";

      case "cancelled":
        return "border-[#c98d83]/25 bg-[#fff8f6] text-[#b46055]";

      case "confirmed":
      case "processing":
      case "dispatched":
      case "shipped":
        return "border-[#d4af52]/30 bg-[#fffaf0] text-[#9a741c]";

      case "pending":
      case "partial_return":
        return "border-[#d9a441]/30 bg-[#fff8e8] text-[#a06f13]";

      default:
        return "border-[#d8d1c4] bg-[#f6f4ef] text-[#857b6c]";
    }
  };

  const getStatusText = (
    status: string
  ) => {
    if (!status) return "N/A";

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        {/* TOP ACCENT */}

        <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

        {/* HEADER */}

        <div className="sticky top-0 z-10 border-b border-[#b8902e]/10 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">
                  Order Management
                </span>
              </div>

              <h2 className="flex items-center gap-2 text-xl font-bold text-[#2a2620]">
                <FiPackage className="text-[#a8841c]" />

                Order Details
              </h2>

              <p className="mt-1 text-sm text-[#a89a7d]">
                {order_reference} •{" "}
                {formatDate(order_date)}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10"
            >
              <FiX size={19} />
            </button>
          </div>

          {/* TABS */}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setActiveTab("items")
              }
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "items"
                  ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/20"
                  : "bg-[#faf8f3] text-[#786f60] hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
              }`}
            >
              <FiPackage
                className="mr-1.5 inline"
                size={13}
              />
              Items ({items.length})
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("details")
              }
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "details"
                  ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/20"
                  : "bg-[#faf8f3] text-[#786f60] hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
              }`}
            >
              <FiUser
                className="mr-1.5 inline"
                size={13}
              />
              Customer Details
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("tracking")
              }
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "tracking"
                  ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/20"
                  : "bg-[#faf8f3] text-[#786f60] hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
              }`}
            >
              <FiTruck
                className="mr-1.5 inline"
                size={13}
              />
              Tracking
            </button>
          </div>
        </div>

        {/* BODY */}

        <div className="max-h-[calc(95vh-190px)] overflow-y-auto p-5 sm:p-6">
          {/* =================================================
              ITEMS
          ================================================= */}

          {activeTab === "items" && (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-[#b8902e]/15">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] border-collapse">
                    <thead>
                      <tr className="bg-[#2f2a22]">
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                          #
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                          Product
                        </th>

                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                          SKU
                        </th>

                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                          Qty
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                          Price
                        </th>

                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                          Total
                        </th>

                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {uiItems.map(
                        (item, idx) => (
                          <tr
                            key={item.id}
                            className="border-b border-[#b8902e]/10 transition hover:bg-[#faf8f3]"
                          >
                            <td className="px-4 py-3 text-sm text-[#8f6d1d]">
                              {idx + 1}
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {item.image ? (
                                  <img
                                    src={
                                      item.image
                                    }
                                    alt={
                                      item.productName
                                    }
                                    className="h-10 w-10 rounded-xl border border-[#b8902e]/15 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                                    <FiPackage size={15} />
                                  </div>
                                )}

                                <span className="text-sm font-semibold text-[#2a2620]">
                                  {
                                    item.productName
                                  }
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span className="rounded-lg bg-[#faf8f3] px-2.5 py-1 text-xs font-semibold text-[#786f60]">
                                {item.sku}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-center text-sm text-[#4a4436]">
                              {item.quantity}
                            </td>

                            <td className="px-4 py-3 text-right text-sm text-[#786f60]">
                              {item.price}
                            </td>

                            <td className="px-4 py-3 text-right text-sm font-bold text-[#2a2620]">
                              {item.total}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusBadge(
                                  item.status.toLowerCase()
                                )}`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />

                                {getStatusText(
                                  item.status
                                )}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ORDER SUMMARY */}

              <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3] p-5">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#d4af52]/20" />

                <div className="mb-4 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

                  <h4 className="text-sm font-bold text-[#2a2620]">
                    Order Summary
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a89a7d]">
                      Subtotal
                    </p>

                    <p className="mt-1 text-base font-bold text-[#2a2620]">
                      ₹
                      {summary?.subtotal?.toLocaleString(
                        "en-IN"
                      ) || "0"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a89a7d]">
                      Shipping
                    </p>

                    <p className="mt-1 text-base font-bold text-[#2a2620]">
                      ₹
                      {summary?.shipping_charge?.toLocaleString(
                        "en-IN"
                      ) || "0"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a89a7d]">
                      Tax (GST)
                    </p>

                    <p className="mt-1 text-base font-bold text-[#2a2620]">
                      ₹
                      {summary?.total_gst?.toLocaleString(
                        "en-IN"
                      ) || "0"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#b8902e]/20 bg-gradient-to-br from-[#fffaf0] to-[#f8f1df] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#9a741c]">
                      Total Payable
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#8f6d1d]">
                      ₹
                      {totalPayable.toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              CUSTOMER DETAILS
          ================================================= */}

          {activeTab === "details" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* CUSTOMER */}

                <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                      <FiUser size={17} />
                    </div>

                    <h4 className="font-bold text-[#2a2620]">
                      Customer Information
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 border-b border-[#b8902e]/10 pb-2.5">
                      <span className="text-xs text-[#a89a7d]">
                        Name
                      </span>

                      <span className="text-right text-sm font-semibold text-[#2a2620]">
                        {user?.name ||
                          "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-b border-[#b8902e]/10 pb-2.5">
                      <span className="text-xs text-[#a89a7d]">
                        Email
                      </span>

                      <span className="max-w-[65%] truncate text-right text-sm font-semibold text-[#2a2620]">
                        {user?.email ||
                          "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-b border-[#b8902e]/10 pb-2.5">
                      <span className="text-xs text-[#a89a7d]">
                        Phone
                      </span>

                      <span className="text-right text-sm font-semibold text-[#2a2620]">
                        {user?.phone ||
                          "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-b border-[#b8902e]/10 pb-2.5">
                      <span className="text-xs text-[#a89a7d]">
                        Order Type
                      </span>

                      <span className="text-sm font-semibold capitalize text-[#8f6d1d]">
                        {orderDetails?.order_type ||
                          "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-[#a89a7d]">
                        Payment Status
                      </span>

                      <span className="rounded-full border border-[#b8902e]/20 bg-white px-2.5 py-1 text-xs font-bold capitalize text-[#8f6d1d]">
                        {payment?.payment_status ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SHIPPING */}

                <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                      <FiMapPin size={17} />
                    </div>

                    <h4 className="font-bold text-[#2a2620]">
                      Shipping Address
                    </h4>
                  </div>

                  <p className="text-sm leading-6 text-[#6b6152]">
                    {delivery_address?.full_address ||
                      "No address provided"}
                  </p>

                  {delivery_address && (
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-[#b8902e]/10 bg-white p-3 text-xs">
                      <div>
                        <span className="text-[#a89a7d]">
                          City:
                        </span>

                        <span className="ml-1 font-semibold text-[#4a4436]">
                          {delivery_address.city ||
                            "N/A"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#a89a7d]">
                          State:
                        </span>

                        <span className="ml-1 font-semibold text-[#4a4436]">
                          {delivery_address.state ||
                            "N/A"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#a89a7d]">
                          Country:
                        </span>

                        <span className="ml-1 font-semibold text-[#4a4436]">
                          {delivery_address.country ||
                            "N/A"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#a89a7d]">
                          Pincode:
                        </span>

                        <span className="ml-1 font-semibold text-[#4a4436]">
                          {delivery_address.pincode ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* TIMELINE */}

              <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                    <FiCalendar size={17} />
                  </div>

                  <h4 className="font-bold text-[#2a2620]">
                    Order Timeline
                  </h4>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#b8902e]" />

                    <span className="text-xs text-[#a89a7d]">
                      Order Placed:
                    </span>

                    <span className="text-sm font-semibold text-[#4a4436]">
                      {formatDate(
                        order_date
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#8f6d1d]" />

                    <span className="text-xs text-[#a89a7d]">
                      Current Status:
                    </span>

                    <span className="text-sm font-bold capitalize text-[#8f6d1d]">
                      {getStatusText(
                        order_status ||
                          "N/A"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              TRACKING
          ================================================= */}

          {activeTab === "tracking" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                    <FiTruck size={17} />
                  </div>

                  <h4 className="font-bold text-[#2a2620]">
                    Tracking Information
                  </h4>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <span className="text-xs text-[#a89a7d]">
                      Order Status
                    </span>

                    <span className="text-sm font-bold capitalize text-[#8f6d1d]">
                      {getStatusText(
                        order_status ||
                          "N/A"
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <span className="text-xs text-[#a89a7d]">
                      Payment Gateway
                    </span>

                    <span className="text-sm font-semibold text-[#2a2620]">
                      {payment?.payment_gateway ||
                        "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <span className="text-xs text-[#a89a7d]">
                      Transaction ID
                    </span>

                    <span className="max-w-[65%] truncate text-sm font-semibold text-[#2a2620]">
                      {payment?.gateway_transaction_id ||
                        "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <span className="text-xs text-[#a89a7d]">
                      Amount Paid
                    </span>

                    <span className="text-sm font-bold text-[#8f6d1d]">
                      ₹
                      {payment?.amount_paid?.toLocaleString(
                        "en-IN"
                      ) || "0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* TRACKING TIMELINE */}

              <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                <h4 className="mb-5 text-sm font-bold text-[#2a2620]">
                  Order Timeline
                </h4>

                <div className="space-y-5">
                  {/* PLACED */}

                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#b8902e]/10">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#b8902e]" />
                      </div>

                      <div className="h-12 w-px bg-[#d4af52]/30" />
                    </div>

                    <div className="pt-1">
                      <p className="font-semibold text-[#2a2620]">
                        Order Placed
                      </p>

                      <p className="mt-1 text-xs text-[#a89a7d]">
                        {formatDate(
                          order_date
                        )}
                      </p>
                    </div>
                  </div>

                  {/* CONFIRMED */}

                  {order_status !==
                    "pending" &&
                    order_status !==
                      "cancelled" && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d4af52]/15">
                            <div className="h-2.5 w-2.5 rounded-full bg-[#c49b3a]" />
                          </div>

                          <div className="h-12 w-px bg-[#d4af52]/30" />
                        </div>

                        <div className="pt-1">
                          <p className="font-semibold text-[#2a2620]">
                            Order Confirmed
                          </p>

                          <p className="mt-1 text-xs text-[#a89a7d]">
                            {formatDate(
                              order_date
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* SHIPPED */}

                  {(order_status ===
                    "dispatched" ||
                    order_status ===
                      "shipped" ||
                    order_status ===
                      "delivered" ||
                    order_status ===
                      "partial_delivered") && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#b8902e]/10">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#b8902e]" />
                        </div>

                        <div className="h-12 w-px bg-[#d4af52]/30" />
                      </div>

                      <div className="pt-1">
                        <p className="font-semibold text-[#2a2620]">
                          {order_status ===
                            "delivered" ||
                          order_status ===
                            "partial_delivered"
                            ? "Delivered"
                            : "Shipped"}
                        </p>

                        <p className="mt-1 text-xs text-[#a89a7d]">
                          {order_status ===
                            "delivered" ||
                          order_status ===
                            "partial_delivered"
                            ? formatDate(
                                order_date
                              )
                            : "In Transit"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CANCELLED */}

                  {order_status ===
                    "cancelled" && (
                    <div className="flex gap-4">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#b46055]/10">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#b46055]" />
                      </div>

                      <div className="pt-1">
                        <p className="font-semibold text-[#b46055]">
                          Order Cancelled
                        </p>

                        <p className="mt-1 text-xs text-[#a89a7d]">
                          {formatDate(
                            order_date
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="sticky bottom-0 flex justify-end border-t border-[#b8902e]/10 bg-[#fffdfa]/95 px-6 py-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition hover:from-[#a8841c] hover:to-[#795b14]"
          >
            Close
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// DISPATCH POPUP
// =====================================================

interface DispatchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  selectedItems?: OrderItem[];
  onDispatch: (trackingDetails: {
    orderId: string;
    items: {
      id: string;
      name: string;
      sku: string;
      quantity: number;
    }[];
    itemCount: number;
    trackingNumber: string;
    courierName: string;
    expectedDelivery: string;
    notes: string;
    isFullOrder: boolean;
  }) => void;
  isFullOrder?: boolean;
}

const DispatchPopup: React.FC<
  DispatchPopupProps
> = ({
  isOpen,
  onClose,
  order,
  selectedItems = [],
  onDispatch,
  isFullOrder = false,
}) => {
  const [trackingNumber, setTrackingNumber] =
    useState("");

  const [courierName, setCourierName] =
    useState("");

  const [
    expectedDelivery,
    setExpectedDelivery,
  ] = useState("");

  const [notes, setNotes] =
    useState("");

  useEffect(() => {
    if (isOpen) {
      setTrackingNumber("");
      setCourierName("");
      setExpectedDelivery("");
      setNotes("");
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) {
    return null;
  }

  const itemsToDispatch = isFullOrder
    ? order.items || []
    : selectedItems;

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    onDispatch({
      orderId: order.id,
      items: itemsToDispatch.map(
        (item) => ({
          id: item.id,
          name: item.productName,
          sku: item.sku,
          quantity: item.quantity,
        })
      ),
      itemCount:
        itemsToDispatch.length,
      trackingNumber,
      courierName,
      expectedDelivery,
      notes,
      isFullOrder,
    });

    onClose();
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        {/* TOP ACCENT */}

        <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

        {/* HEADER */}

        <div className="sticky top-0 z-10 border-b border-[#b8902e]/10 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">
                  Fulfillment
                </span>
              </div>

              <h2 className="flex items-center gap-2 text-xl font-bold text-[#2a2620]">
                <FiTruck className="text-[#a8841c]" />

                {isFullOrder
                  ? "Dispatch Entire Order"
                  : `Dispatch ${itemsToDispatch.length} Items`}
              </h2>

              <p className="mt-1 text-sm text-[#a89a7d]">
                {order.id} •{" "}
                {order.customer}
                {!isFullOrder &&
                  ` • ${itemsToDispatch.length} item(s) selected`}
                {isFullOrder &&
                  ` • All ${itemsToDispatch.length} item(s)`}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] text-[#8f6d1d] transition hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10"
            >
              <FiX size={19} />
            </button>
          </div>
        </div>

        {/* BODY */}

        <div className="max-h-[calc(95vh-180px)] overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-5 sm:p-6"
          >
            {/* ORDER SUMMARY */}

            <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3] p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#d4af52]/20" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                    Order Total
                  </span>

                  <p className="mt-1 text-lg font-bold text-[#2a2620]">
                    {order.total}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                    Items
                  </span>

                  <p className="mt-1 text-lg font-bold text-[#8f6d1d]">
                    {itemsToDispatch.length}{" "}
                    <span className="text-xs font-semibold text-[#a89a7d]">
                      {isFullOrder
                        ? "(All)"
                        : "(Selected)"}
                    </span>
                  </p>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">
                    Shipping Address
                  </span>

                  <p className="mt-1 text-sm font-semibold leading-6 text-[#4a4436]">
                    {order.shippingAddress ||
                      "N/A"}
                  </p>
                </div>
              </div>

              {isFullOrder && (
                <div className="mt-4 rounded-xl border border-[#b8902e]/15 bg-white p-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#8f6d1d]">
                    <FiPackage size={13} />

                    Dispatching all items in this order
                  </span>
                </div>
              )}
            </div>

            {/* ITEMS */}

            {itemsToDispatch.length >
              0 && (
              <div className="rounded-2xl border border-[#b8902e]/15 bg-[#fffaf0] p-5">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2a2620]">
                  <FiPackage className="text-[#a8841c]" />

                  {isFullOrder
                    ? "All Items in Order"
                    : "Selected Items to Dispatch"}
                </h4>

                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {itemsToDispatch.map(
                    (item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-[#b8902e]/10 bg-white p-3"
                      >
                        <span className="min-w-0 truncate text-sm font-semibold text-[#4a4436]">
                          {idx + 1}.{" "}
                          {item.productName}
                        </span>

                        <span className="shrink-0 text-xs text-[#a89a7d]">
                          Qty:{" "}
                          {item.quantity}{" "}
                          • SKU:{" "}
                          {item.sku}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* TRACKING DETAILS */}

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                  <FiTruck size={17} />
                </div>

                <h3 className="font-bold text-[#2a2620]">
                  Tracking Details
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* TRACKING */}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                    Tracking Number{" "}
                    <span className="text-[#b46055]">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) =>
                      setTrackingNumber(
                        e.target.value
                      )
                    }
                    placeholder="Enter tracking number"
                    className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                    required
                  />
                </div>

                {/* COURIER */}

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                    Courier Name{" "}
                    <span className="text-[#b46055]">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) =>
                      setCourierName(
                        e.target.value
                      )
                    }
                    placeholder="Enter courier name"
                    className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                    required
                  />
                </div>
              </div>

              {/* DATE */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                  Expected Delivery Date
                </label>

                <input
                  type="date"
                  value={
                    expectedDelivery
                  }
                  onChange={(e) =>
                    setExpectedDelivery(
                      e.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#2a2620] outline-none transition-all focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                />
              </div>

              {/* NOTES */}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                  Notes (Optional)
                </label>

                <textarea
                  value={notes}
                  onChange={(e) =>
                    setNotes(
                      e.target.value
                    )
                  }
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 py-3 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                />
              </div>
            </div>

            {/* ACTIONS */}

            <div className="flex flex-col gap-3 border-t border-[#b8902e]/10 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#b8902e]/20 bg-white px-4 py-3 text-sm font-semibold text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-3 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition hover:from-[#a8841c] hover:to-[#795b14]"
              >
                <FiTruck size={17} />

                {isFullOrder
                  ? `Dispatch Entire Order (${itemsToDispatch.length} items)`
                  : `Dispatch ${itemsToDispatch.length} Items`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// ORDERS TABLE
// =====================================================

interface OrdersTableProps {
  onSelectOrder: (
    order: Order
  ) => void;
  selectedOrderId?: string;
}

const OrdersTable: React.FC<
  OrdersTableProps
> = ({
  onSelectOrder,
  selectedOrderId,
}) => {
  const [search, setSearch] =
    useState("");

  const [dateFilter, setDateFilter] =
    useState("All Dates");

  const [statusFilter, setStatusFilter] =
    useState("Status: All");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [
    showMobileFilters,
    setShowMobileFilters,
  ] = useState(false);

  const [
    expandedRows,
    setExpandedRows,
  ] = useState<Set<string>>(
    new Set()
  );

  const [showViewPopup, setShowViewPopup] =
    useState(false);

  const [
    showDispatchPopup,
    setShowDispatchPopup,
  ] = useState(false);

  const [
    selectedOrderForView,
    setSelectedOrderForView,
  ] = useState<number | null>(null);

  const [
    selectedOrderForDispatch,
    setSelectedOrderForDispatch,
  ] = useState<Order | null>(null);

  const [
    selectedItemsForDispatch,
    setSelectedItemsForDispatch,
  ] = useState<OrderItem[]>([]);

  const [
    selectedItemsMap,
    setSelectedItemsMap,
  ] = useState<
    Map<string, boolean>
  >(new Map());

  const [
    isFullOrderDispatch,
    setIsFullOrderDispatch,
  ] = useState(false);

  const [orders, setOrders] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    availableStatuses,
    setAvailableStatuses,
  ] = useState<string[]>([]);

  const itemsPerPage = 6;

  // ===================================================
  // FETCH
  // ===================================================

  useEffect(() => {
    fetchOrders();
    fetchStatuses();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await orderApi.getOrders();

      if (response.data.success) {
        setOrders(
          response.data.data
        );
      } else {
        setError(
          "Failed to fetch orders"
        );
      }
    } catch (err) {
      setError(
        "An error occurred while fetching orders"
      );

      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response =
        await orderApi.getOrderStatuses();

      if (response.data.success) {
        setAvailableStatuses(
          response.data.data
        );
      }
    } catch (err) {
      console.error(
        "Failed to fetch order statuses:",
        err
      );
    }
  };

  // ===================================================
  // STATUS BADGE
  // ===================================================

  const getStatusBadge = (
    status: string
  ) => {
    switch (status) {
      case "delivered":
      case "partial_delivered":
        return "border-[#b8902e]/25 bg-[#f8f3e5] text-[#8f6d1d]";

      case "cancelled":
        return "border-[#c98d83]/25 bg-[#fff8f6] text-[#b46055]";

      case "confirmed":
      case "processing":
      case "dispatched":
      case "shipped":
        return "border-[#d4af52]/30 bg-[#fffaf0] text-[#9a741c]";

      case "pending":
      case "partial_return":
        return "border-[#d9a441]/30 bg-[#fff8e8] text-[#a06f13]";

      default:
        return "border-[#d8d1c4] bg-[#f6f4ef] text-[#857b6c]";
    }
  };

  const formatStatus = (
    status: string
  ) => {
    if (!status) return "N/A";

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  // ===================================================
  // CONVERT API ORDER
  // ===================================================

  const convertToOrder = (
    apiOrder: any,
    index: number
  ): Order => {
    return {
      id:
        apiOrder.order_reference,
      sNo: index + 1,
      date: apiOrder.order_date
        ? new Date(
            apiOrder.order_date
          ).toLocaleDateString(
            "en-IN",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            }
          )
        : "N/A",
      customer:
        apiOrder.user?.name ||
        "N/A",
      customerName:
        apiOrder.user?.name ||
        "N/A",
      total: `₹${Number(
        apiOrder.total_payable || 0
      ).toLocaleString("en-IN")}`,
      paymentStatus:
        apiOrder.payment_status ||
        "N/A",
      orderStatus:
        apiOrder.order_status ||
        "N/A",
      orderType:
        apiOrder.order_type ||
        "retail",
      amountPaid:
        apiOrder.amount_paid ||
        0,
      subtotal:
        apiOrder.subtotal || 0,
      totalGst:
        apiOrder.total_gst || 0,
      shippingCharge:
        apiOrder.shipping_charge ||
        0,
      userId:
        apiOrder.user?.id || 0,
      userEmail:
        apiOrder.user?.email ||
        "N/A",
      userPhone:
        apiOrder.user?.phone ||
        "N/A",
      shippingAddress:
        apiOrder.shipping_address
          ?.full_address || "N/A",
      trackingNumber:
        apiOrder.gateway_transaction_id ||
        "N/A",

      items:
        apiOrder.items?.map(
          (item: any) => ({
            id: String(
              item.line_id
            ),
            productName:
              item.product_name ||
              "N/A",
            sku:
              item.product_code ||
              "N/A",
            quantity:
              item.quantity,
            price: `₹${Number(
              item.unit_price || 0
            ).toLocaleString(
              "en-IN"
            )}`,
            total: `₹${Number(
              item.line_total || 0
            ).toLocaleString(
              "en-IN"
            )}`,
            status:
              item.delivery_status
                ?.charAt(0)
                .toUpperCase() +
                item.delivery_status?.slice(
                  1
                ) || "Pending",
            image:
              item.primary_image ||
              undefined,
          })
        ) || [],
    };
  };

  // ===================================================
  // UI ORDERS
  // ===================================================

  const uiOrders = useMemo(() => {
    return orders.map(
      (order, index) =>
        convertToOrder(
          order,
          index
        )
    );
  }, [orders]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredOrders = useMemo(() => {
    return uiOrders.filter(
      (order) => {
        const searchText =
          search.toLowerCase().trim();

        const searchMatch =
          !searchText ||
          order.id
            .toLowerCase()
            .includes(
              searchText
            ) ||
          order.customer
            .toLowerCase()
            .includes(
              searchText
            ) ||
          order.customerName
            .toLowerCase()
            .includes(
              searchText
            );

        const statusMatch =
          statusFilter ===
            "Status: All" ||
          order.orderStatus ===
            statusFilter.replace(
              "Status: ",
              ""
            );

        return (
          searchMatch &&
          statusMatch
        );
      }
    );
  }, [
    uiOrders,
    search,
    statusFilter,
    dateFilter,
  ]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredOrders.length /
        itemsPerPage
    )
  );

  const visibleOrders =
    filteredOrders.slice(
      (currentPage - 1) *
        itemsPerPage,
      currentPage *
        itemsPerPage
    );

  const changePage = (
    page: number
  ) => {
    setCurrentPage(
      Math.min(
        Math.max(page, 1),
        totalPages
      )
    );
  };

  const clearFilters = () => {
    setSearch("");
    setDateFilter("All Dates");
    setStatusFilter("Status: All");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search !== "" ||
    dateFilter !== "All Dates" ||
    statusFilter !== "Status: All";

  // ===================================================
  // ROW
  // ===================================================

  const toggleRow = (
    orderId: string
  ) => {
    const newExpanded =
      new Set(expandedRows);

    if (
      newExpanded.has(orderId)
    ) {
      newExpanded.delete(
        orderId
      );
    } else {
      newExpanded.add(
        orderId
      );
    }

    setExpandedRows(
      newExpanded
    );
  };

  // ===================================================
  // VIEW ORDER
  // ===================================================

  const handleViewOrder = (
    orderId: string
  ) => {
    const apiOrder =
      orders.find(
        (o) =>
          o.order_reference ===
          orderId
      );

    if (apiOrder) {
      setSelectedOrderForView(
        apiOrder.order_id
      );

      setShowViewPopup(true);

      const uiOrder =
        uiOrders.find(
          (o) =>
            o.id === orderId
        );

      if (uiOrder) {
        onSelectOrder(
          uiOrder
        );
      }
    }
  };

  // ===================================================
  // ITEM SELECTION
  // ===================================================

  const toggleItemSelection = (
    orderId: string,
    itemId: string
  ) => {
    const key = `${orderId}-${itemId}`;

    const newMap =
      new Map(
        selectedItemsMap
      );

    newMap.set(
      key,
      !newMap.get(key)
    );

    setSelectedItemsMap(
      newMap
    );
  };

  const toggleAllItems = (
    orderId: string,
    items: OrderItem[]
  ) => {
    if (items.length === 0)
      return;

    const allSelected =
      items.every((item) =>
        selectedItemsMap.get(
          `${orderId}-${item.id}`
        )
      );

    const newMap =
      new Map(
        selectedItemsMap
      );

    items.forEach(
      (item) => {
        newMap.set(
          `${orderId}-${item.id}`,
          !allSelected
        );
      }
    );

    setSelectedItemsMap(
      newMap
    );
  };

  const getSelectedItemsForOrder =
    (
      orderId: string,
      items: OrderItem[]
    ) => {
      return items.filter(
        (item) =>
          selectedItemsMap.get(
            `${orderId}-${item.id}`
          )
      );
    };

  // ===================================================
  // DISPATCH SELECTED
  // ===================================================

  const handleDispatchSelected =
    (order: Order) => {
      const selectedItems =
        getSelectedItemsForOrder(
          order.id,
          order.items || []
        );

      if (
        selectedItems.length ===
        0
      ) {
        alert(
          "Please select at least one item to dispatch."
        );

        return;
      }

      setIsFullOrderDispatch(
        false
      );

      setSelectedOrderForDispatch(
        order
      );

      setSelectedItemsForDispatch(
        selectedItems
      );

      setShowDispatchPopup(
        true
      );
    };

  // ===================================================
  // DISPATCH FULL
  // ===================================================

  const handleDispatchFullOrder =
    (order: Order) => {
      if (
        !order.items ||
        order.items.length === 0
      ) {
        alert(
          "This order has no items to dispatch."
        );

        return;
      }

      setIsFullOrderDispatch(
        true
      );

      setSelectedOrderForDispatch(
        order
      );

      setSelectedItemsForDispatch(
        []
      );

      setShowDispatchPopup(
        true
      );
    };

  // ===================================================
  // DISPATCH SUBMIT
  // ===================================================

  const handleDispatchSubmit =
    (trackingDetails: {
      orderId: string;
      items: {
        id: string;
        name: string;
        sku: string;
        quantity: number;
      }[];
      itemCount: number;
      trackingNumber: string;
      courierName: string;
      expectedDelivery: string;
      notes: string;
      isFullOrder: boolean;
    }) => {
      console.log(
        "Dispatch submitted:",
        trackingDetails
      );

      const itemNames =
        trackingDetails.items
          .map(
            (item) =>
              item.name
          )
          .join(", ");

      alert(
        `Dispatched ${trackingDetails.itemCount} item(s): ${itemNames}`
      );

      setSelectedItemsMap(
        new Map()
      );
    };

  // ===================================================
  // CLOSE POPUPS
  // ===================================================

  const closeViewPopup = () => {
    setShowViewPopup(false);
    setSelectedOrderForView(
      null
    );
  };

  const closeDispatchPopup = () => {
    setShowDispatchPopup(false);

    setSelectedOrderForDispatch(
      null
    );

    setSelectedItemsForDispatch(
      []
    );

    setIsFullOrderDispatch(
      false
    );
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#b8902e]/15 bg-white p-10 shadow-sm">
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
            <FiLoader
              size={28}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 text-sm font-bold text-[#2a2620]">
            Loading orders...
          </p>

          <p className="mt-1 text-xs text-[#a89a7d]">
            Please wait while we fetch your
            orders.
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error) {
    return (
      <div className="rounded-2xl border border-[#b46055]/15 bg-white p-10 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b46055]/10 text-[#b46055]">
            <FiAlertCircle size={27} />
          </div>

          <p className="mt-4 text-sm font-bold text-[#b46055]">
            {error}
          </p>

          <button
            type="button"
            onClick={fetchOrders}
            className="mt-5 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition hover:from-[#a8841c] hover:to-[#795b14]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        {/* =================================================
            FILTER CARD
        ================================================= */}

        <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white p-4 shadow-sm sm:p-5">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#d4af52] via-[#c49b3a] to-[#8a6c1f]" />

          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#d4af52]/20" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* SEARCH */}

            <div className="relative min-w-0 flex-1">
              <FiSearch
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(
                    e.target.value
                  );

                  setCurrentPage(1);
                }}
                placeholder="Search orders, customers..."
                className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-10 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89a7d] transition hover:text-[#8f6d1d]"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>

            {/* DESKTOP FILTERS */}

            <div className="hidden items-center gap-3 lg:flex">
              <div className="relative">
                <select
                  value={
                    statusFilter
                  }
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value
                    );

                    setCurrentPage(
                      1
                    );
                  }}
                  className="h-12 cursor-pointer appearance-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 pr-10 text-sm text-[#4a4436] outline-none transition-all focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                >
                  <option>
                    Status: All
                  </option>

                  {availableStatuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatStatus(
                          status
                        )}
                      </option>
                    )
                  )}
                </select>

                <FiChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#a89a7d]"
                  size={16}
                />
              </div>

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className={`h-12 rounded-xl px-4 text-sm font-semibold transition-all ${
                  hasActiveFilters
                    ? "bg-[#b8902e]/10 text-[#8f6d1d] hover:bg-[#b8902e]/15"
                    : "text-[#a89a7d] hover:text-[#8f6d1d]"
                }`}
              >
                <FiFilter
                  size={15}
                  className="mr-1.5 inline"
                />
                Clear Filters
              </button>
            </div>

            {/* MOBILE FILTER BUTTON */}

            <button
              type="button"
              onClick={() =>
                setShowMobileFilters(
                  !showMobileFilters
                )
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] px-4 text-sm font-semibold text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d] lg:hidden"
            >
              <FiFilter size={15} />

              Filters

              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#b8902e] text-[10px] font-bold text-white">
                  !
                </span>
              )}
            </button>
          </div>

          {/* MOBILE FILTERS */}

          {showMobileFilters && (
            <div className="relative z-10 mt-4 space-y-3 border-t border-[#b8902e]/10 pt-4 lg:hidden">
              <div className="relative">
                <select
                  value={
                    statusFilter
                  }
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value
                    );

                    setCurrentPage(
                      1
                    );
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 pr-10 text-sm text-[#4a4436] outline-none focus:border-[#b8902e]"
                >
                  <option>
                    Status: All
                  </option>

                  {availableStatuses.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {formatStatus(
                          status
                        )}
                      </option>
                    )
                  )}
                </select>

                <FiChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#a89a7d]"
                  size={16}
                />
              </div>

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="h-11 w-full rounded-xl bg-[#b8902e]/10 text-sm font-semibold text-[#8f6d1d] transition hover:bg-[#b8902e]/15"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* =================================================
            ORDER TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

          {/* DESKTOP */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1080px] border-collapse">
              <thead>
                <tr className="bg-[#2f2a22]">
                  <th className="w-[45px] px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    <FiChevronDown
                      size={16}
                      className="mx-auto opacity-50"
                    />
                  </th>

                  <th className="w-[60px] px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    S.No
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Order ID
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Date
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Customer
                  </th>

                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Total
                  </th>

                  <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Status
                  </th>

                  <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleOrders.length >
                0 ? (
                  visibleOrders.map(
                    (
                      order,
                      index
                    ) => (
                      <React.Fragment
                        key={order.id}
                      >
                        {/* MAIN ROW */}

                        <tr
                          onClick={() =>
                            toggleRow(
                              order.id
                            )
                          }
                          className={`group cursor-pointer border-b border-[#b8902e]/10 transition-colors ${
                            selectedOrderId ===
                            order.id
                              ? "bg-[#fffaf0]"
                              : "bg-white hover:bg-[#faf8f3]"
                          }`}
                        >
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={(
                                e
                              ) => {
                                e.stopPropagation();

                                toggleRow(
                                  order.id
                                );
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e]/10"
                            >
                              {expandedRows.has(
                                order.id
                              ) ? (
                                <FiChevronUp
                                  size={
                                    16
                                  }
                                />
                              ) : (
                                <FiChevronDown
                                  size={
                                    16
                                  }
                                />
                              )}
                            </button>
                          </td>

                          <td className="px-4 py-4 text-center">
                            <span className="text-xs font-bold text-[#8f6d1d]">
                              {order.sNo}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-lg bg-[#faf8f3] px-3 py-1.5 text-xs font-bold tracking-wide text-[#4a4436]">
                              {order.id}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs font-medium text-[#786f60]">
                            {order.date}
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-[#2a2620]">
                              {order.customer}
                            </p>

                            <p className="mt-0.5 text-xs text-[#a89a7d]">
                              {order.customerName}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-[#8f6d1d]">
                              {order.total}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusBadge(
                                order.orderStatus
                              )}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />

                              {formatStatus(
                                order.orderStatus
                              )}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* VIEW */}

                              <button
                                type="button"
                                onClick={(
                                  e
                                ) => {
                                  e.stopPropagation();

                                  handleViewOrder(
                                    order.id
                                  );
                                }}
                                className="group/view flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition-all hover:border-[#b8902e] hover:bg-[#b8902e] hover:text-white hover:shadow-md hover:shadow-[#b8902e]/20"
                                title="View Order"
                              >
                                <FiEye
                                  size={
                                    16
                                  }
                                />
                              </button>

                              {/* DISPATCH */}

                              <button
                                type="button"
                                onClick={(
                                  e
                                ) => {
                                  e.stopPropagation();

                                  handleDispatchFullOrder(
                                    order
                                  );
                                }}
                                className="group/dispatch flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition-all hover:border-[#8f6d1d] hover:bg-[#8f6d1d] hover:text-white hover:shadow-md hover:shadow-[#8f6d1d]/20"
                                title="Dispatch Entire Order"
                              >
                                <FiTruck
                                  size={
                                    16
                                  }
                                />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* EXPANDED */}

                        {expandedRows.has(
                          order.id
                        ) && (
                          <tr>
                            <td
                              colSpan={
                                8
                              }
                              className="bg-[#faf8f3] px-6 py-0"
                            >
                              <div className="overflow-hidden">
                                <div className="animate-slideDown py-5">
                                  <div className="space-y-4">
                                    {/* Expanded Header */}

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                                          <FiPackage
                                            size={
                                              16
                                            }
                                          />
                                        </div>

                                        <div>
                                          <h4 className="text-sm font-bold text-[#2a2620]">
                                            Order
                                            Items
                                          </h4>

                                          <p className="text-xs text-[#a89a7d]">
                                            {order.items?.length ||
                                              0}{" "}
                                            items
                                            in
                                            this
                                            order
                                          </p>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(
                                          e
                                        ) => {
                                          e.stopPropagation();

                                          handleDispatchFullOrder(
                                            order
                                          );
                                        }}
                                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a8841c] hover:to-[#795b14]"
                                      >
                                        <FiTruck
                                          size={
                                            14
                                          }
                                        />
                                        Dispatch
                                        All
                                      </button>
                                    </div>

                                    {/* Expanded Items */}

                                    <div className="overflow-x-auto rounded-2xl border border-[#b8902e]/15 bg-white">
                                      <table className="w-full min-w-[900px] border-collapse">
                                        <thead>
                                          <tr className="border-b border-[#b8902e]/10 bg-[#fffdfa]">
                                            <th className="w-[45px] px-4 py-3 text-center">
                                              <button
                                                type="button"
                                                onClick={(
                                                  e
                                                ) => {
                                                  e.stopPropagation();

                                                  toggleAllItems(
                                                    order.id,
                                                    order.items ||
                                                      []
                                                  );
                                                }}
                                                className="text-[#8f6d1d] hover:text-[#b8902e]"
                                              >
                                                {order.items &&
                                                order.items.length >
                                                  0 &&
                                                order.items.every(
                                                  (
                                                    item
                                                  ) =>
                                                    selectedItemsMap.get(
                                                      `${order.id}-${item.id}`
                                                    )
                                                ) ? (
                                                  <FiCheck
                                                    size={
                                                      16
                                                    }
                                                  />
                                                ) : (
                                                  <FiSquare
                                                    size={
                                                      16
                                                    }
                                                  />
                                                )}
                                              </button>
                                            </th>

                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">
                                              #
                                            </th>

                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">
                                              Product
                                            </th>

                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">
                                              SKU
                                            </th>

                                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">
                                              Qty
                                            </th>

                                            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">
                                              Price
                                            </th>

                                            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">
                                              Total
                                            </th>

                                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">
                                              Status
                                            </th>
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {(
                                            order.items ||
                                            []
                                          ).map(
                                            (
                                              item,
                                              idx
                                            ) => {
                                              const isSelected =
                                                selectedItemsMap.get(
                                                  `${order.id}-${item.id}`
                                                );

                                              return (
                                                <tr
                                                  key={
                                                    item.id
                                                  }
                                                  className={`border-b border-[#b8902e]/10 last:border-0 ${
                                                    isSelected
                                                      ? "bg-[#fffaf0]"
                                                      : "hover:bg-[#faf8f3]"
                                                  }`}
                                                >
                                                  <td className="px-4 py-3 text-center">
                                                    <button
                                                      type="button"
                                                      onClick={(
                                                        e
                                                      ) => {
                                                        e.stopPropagation();

                                                        toggleItemSelection(
                                                          order.id,
                                                          item.id
                                                        );
                                                      }}
                                                      className="text-[#8f6d1d] hover:text-[#b8902e]"
                                                    >
                                                      {isSelected ? (
                                                        <FiCheck
                                                          size={
                                                            17
                                                          }
                                                        />
                                                      ) : (
                                                        <FiSquare
                                                          size={
                                                            17
                                                          }
                                                        />
                                                      )}
                                                    </button>
                                                  </td>

                                                  <td className="px-4 py-3 text-xs text-[#8f6d1d]">
                                                    {idx +
                                                      1}
                                                  </td>

                                                  <td className="px-4 py-3 text-sm font-medium text-[#4a4436]">
                                                    {
                                                      item.productName
                                                    }
                                                  </td>

                                                  <td className="px-4 py-3">
                                                    <span className="text-xs text-[#a89a7d]">
                                                      {
                                                        item.sku
                                                      }
                                                    </span>
                                                  </td>

                                                  <td className="px-4 py-3 text-center text-sm text-[#4a4436]">
                                                    {
                                                      item.quantity
                                                    }
                                                  </td>

                                                  <td className="px-4 py-3 text-right text-sm text-[#786f60]">
                                                    {
                                                      item.price
                                                    }
                                                  </td>

                                                  <td className="px-4 py-3 text-right text-sm font-bold text-[#2a2620]">
                                                    {
                                                      item.total
                                                    }
                                                  </td>

                                                  <td className="px-4 py-3 text-center">
                                                    <span
                                                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusBadge(
                                                        item.status.toLowerCase()
                                                      )}`}
                                                    >
                                                      {formatStatus(
                                                        item.status
                                                      )}
                                                    </span>
                                                  </td>
                                                </tr>
                                              );
                                            }
                                          )}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* Expanded Footer */}

                                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#b8902e]/10 pt-4">
                                      <div className="flex min-w-0 items-center gap-2 text-xs text-[#786f60]">
                                        <FiMapPin
                                          size={
                                            14
                                          }
                                          className="shrink-0 text-[#a8841c]"
                                        />

                                        <span className="truncate">
                                          {order.shippingAddress ||
                                            "No address"}
                                        </span>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={(
                                            e
                                          ) => {
                                            e.stopPropagation();

                                            handleViewOrder(
                                              order.id
                                            );
                                          }}
                                          className="rounded-xl border border-[#b8902e]/20 bg-white px-4 py-2 text-xs font-semibold text-[#8f6d1d] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3]"
                                        >
                                          <FiEye
                                            size={
                                              14
                                            }
                                            className="mr-1.5 inline"
                                          />
                                          View Details
                                        </button>

                                        <button
                                          type="button"
                                          onClick={(
                                            e
                                          ) => {
                                            e.stopPropagation();

                                            handleDispatchSelected(
                                              order
                                            );
                                          }}
                                          className="flex items-center gap-1.5 rounded-xl bg-[#2f2a22] px-4 py-2 text-xs font-bold text-[#f3dfab] transition hover:bg-[#403a30]"
                                        >
                                          <FiTruck
                                            size={
                                              14
                                            }
                                          />
                                          Dispatch
                                          Selected (
                                          {
                                            getSelectedItemsForOrder(
                                              order.id,
                                              order.items ||
                                                []
                                            ).length
                                          }
                                          )
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={
                        8
                      }
                      className="px-6 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                          <FiSearch size={24} />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#2a2620]">
                          No orders found
                        </p>

                        <p className="mt-1 text-xs text-[#a89a7d]">
                          Try adjusting your
                          filters or search
                          criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              MOBILE
          ================================================= */}

          <div className="block lg:hidden">
            {visibleOrders.length >
            0 ? (
              visibleOrders.map(
                (order) => (
                  <div
                    key={order.id}
                    onClick={() =>
                      toggleRow(
                        order.id
                      )
                    }
                    className={`cursor-pointer border-b border-[#b8902e]/10 p-5 transition-colors ${
                      selectedOrderId ===
                      order.id
                        ? "bg-[#fffaf0]"
                        : "bg-white hover:bg-[#faf8f3]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-lg bg-[#faf8f3] px-2.5 py-1 text-xs font-bold text-[#4a4436]">
                          {order.id}
                        </span>

                        <p className="mt-2 text-xs text-[#a89a7d]">
                          {order.date}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            handleViewOrder(
                              order.id
                            );
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d]"
                        >
                          <FiEye size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            handleDispatchFullOrder(
                              order
                            );
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d]"
                        >
                          <FiTruck size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            toggleRow(
                              order.id
                            );
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#786f60]"
                        >
                          {expandedRows.has(
                            order.id
                          ) ? (
                            <FiChevronUp
                              size={
                                15
                              }
                            />
                          ) : (
                            <FiChevronDown
                              size={
                                15
                              }
                            />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-bold text-[#2a2620]">
                        {
                          order.customer
                        }
                      </p>

                      <p className="mt-0.5 text-xs text-[#a89a7d]">
                        {
                          order.customerName
                        }
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-base font-bold text-[#8f6d1d]">
                        {order.total}
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusBadge(
                          order.orderStatus
                        )}`}
                      >
                        {formatStatus(
                          order.orderStatus
                        )}
                      </span>
                    </div>

                    {/* MOBILE EXPANDED */}

                    {expandedRows.has(
                      order.id
                    ) && (
                      <div className="mt-4 animate-slideDown border-t border-[#b8902e]/10 pt-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-[#6b6152]">
                              Items
                            </h5>

                            <p className="mt-0.5 text-[11px] text-[#a89a7d]">
                              {order.items?.length ||
                                0}{" "}
                              items
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(
                                e
                              ) => {
                                e.stopPropagation();

                                handleDispatchFullOrder(
                                  order
                                );
                              }}
                              className="text-xs font-bold text-[#8f6d1d]"
                            >
                              <FiTruck
                                size={
                                  13
                                }
                                className="mr-1 inline"
                              />
                              Dispatch
                              All
                            </button>

                            <button
                              type="button"
                              onClick={(
                                e
                              ) => {
                                e.stopPropagation();

                                toggleAllItems(
                                  order.id,
                                  order.items ||
                                    []
                                );
                              }}
                              className="text-xs font-bold text-[#a8841c]"
                            >
                              {order.items &&
                              order.items.length >
                                0 &&
                              order.items.every(
                                (
                                  item
                                ) =>
                                  selectedItemsMap.get(
                                    `${order.id}-${item.id}`
                                  )
                              )
                                ? "Deselect All"
                                : "Select All"}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(
                            order.items ||
                            []
                          ).map(
                            (item) => {
                              const isSelected =
                                selectedItemsMap.get(
                                  `${order.id}-${item.id}`
                                );

                              return (
                                <div
                                  key={
                                    item.id
                                  }
                                  className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                                    isSelected
                                      ? "border-[#b8902e]/25 bg-[#fffaf0]"
                                      : "border-[#b8902e]/10 bg-[#faf8f3]"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={(
                                      e
                                    ) => {
                                      e.stopPropagation();

                                      toggleItemSelection(
                                        order.id,
                                        item.id
                                      );
                                    }}
                                    className="shrink-0 text-[#8f6d1d]"
                                  >
                                    {isSelected ? (
                                      <FiCheck
                                        size={
                                          16
                                        }
                                      />
                                    ) : (
                                      <FiSquare
                                        size={
                                          16
                                        }
                                      />
                                    )}
                                  </button>

                                  <div className="ml-1 min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-[#2a2620]">
                                      {
                                        item.productName
                                      }
                                    </p>

                                    <p className="mt-0.5 truncate text-[11px] text-[#a89a7d]">
                                      SKU:{" "}
                                      {
                                        item.sku
                                      }
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <p className="text-sm font-bold text-[#8f6d1d]">
                                      {
                                        item.total
                                      }
                                    </p>

                                    <p className="mt-0.5 text-[11px] text-[#a89a7d]">
                                      Qty:{" "}
                                      {
                                        item.quantity
                                      }
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            handleDispatchSelected(
                              order
                            );
                          }}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15"
                        >
                          <FiTruck
                            size={14}
                          />
                          Dispatch Selected (
                          {
                            getSelectedItemsForOrder(
                              order.id,
                              order.items ||
                                []
                            ).length
                          }
                          )
                        </button>
                      </div>
                    )}
                  </div>
                )
              )
            ) : (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                  <FiSearch size={24} />
                </div>

                <p className="mt-4 text-sm font-bold text-[#2a2620]">
                  No orders found
                </p>

                <p className="mt-1 text-xs text-[#a89a7d]">
                  Try adjusting your
                  filters.
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          {filteredOrders.length >
            0 && (
            <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#8b8171]">
                  Showing{" "}
                  <span className="font-bold text-[#4a4436]">
                    {(currentPage -
                      1) *
                      itemsPerPage +
                      1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#4a4436]">
                    {Math.min(
                      currentPage *
                        itemsPerPage,
                      filteredOrders.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#4a4436]">
                    {
                      filteredOrders.length
                    }
                  </span>{" "}
                  entries
                </p>

                <div className="flex items-center justify-center gap-1.5">
                  {/* PREVIOUS */}

                  <button
                    type="button"
                    onClick={() =>
                      changePage(
                        currentPage -
                          1
                      )
                    }
                    disabled={
                      currentPage ===
                      1
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft
                      size={17}
                    />
                  </button>

                  {/* PAGE 1-3 */}

                  {[
                    ...Array(
                      Math.min(
                        totalPages,
                        3
                      )
                    ),
                  ].map(
                    (_, index) => {
                      const page =
                        index +
                        1;

                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() =>
                            changePage(
                              page
                            )
                          }
                          className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${
                            currentPage ===
                            page
                              ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white shadow-md shadow-[#b8902e]/20"
                              : "text-[#786f60] hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                  )}

                  {totalPages >
                    3 && (
                    <>
                      <span className="px-1 text-xs text-[#a89a7d]">
                        ...
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          changePage(
                            totalPages
                          )
                        }
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${
                          currentPage ===
                          totalPages
                            ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white"
                            : "text-[#786f60] hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                        }`}
                      >
                        {
                          totalPages
                        }
                      </button>
                    </>
                  )}

                  {/* NEXT */}

                  <button
                    type="button"
                    onClick={() =>
                      changePage(
                        currentPage +
                          1
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight
                      size={17}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================
          VIEW ORDER POPUP
      ================================================= */}

      <ViewOrderPopup
        isOpen={
          showViewPopup
        }
        onClose={
          closeViewPopup
        }
        orderId={
          selectedOrderForView
        }
      />

      {/* =================================================
          DISPATCH POPUP
      ================================================= */}

      <DispatchPopup
        isOpen={
          showDispatchPopup
        }
        onClose={
          closeDispatchPopup
        }
        order={
          selectedOrderForDispatch
        }
        selectedItems={
          selectedItemsForDispatch
        }
        onDispatch={
          handleDispatchSubmit
        }
        isFullOrder={
          isFullOrderDispatch
        }
      />

      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
              max-height: 0;
            }

            to {
              opacity: 1;
              transform: translateY(0);
              max-height: 1000px;
            }
          }

          .animate-slideDown {
            animation: slideDown 0.35s ease-out forwards;
          }
        `}
      </style>
    </>
  );
};

// =====================================================
// MAIN ORDERS COMPONENT
// =====================================================

const Orders: React.FC = () => {
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [ordersData, setOrdersData] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  // ===================================================
  // FETCH ORDERS
  // ===================================================

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);

    try {
      const response =
        await orderApi.getOrders();

      if (response.data.success) {
        setOrdersData(
          response.data.data
        );
      }
    } catch (err) {
      console.error(
        "Failed to fetch orders:",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // CONVERT
  // ===================================================

  const convertToOrder = (
    apiOrder: any,
    index: number
  ): Order => {
    return {
      id:
        apiOrder.order_reference,
      sNo: index + 1,
      date: apiOrder.order_date
        ? new Date(
            apiOrder.order_date
          ).toLocaleDateString(
            "en-IN",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            }
          )
        : "N/A",
      customer:
        apiOrder.user?.name ||
        "N/A",
      customerName:
        apiOrder.user?.name ||
        "N/A",
      total: `₹${Number(
        apiOrder.total_payable || 0
      ).toLocaleString(
        "en-IN"
      )}`,
      paymentStatus:
        apiOrder.payment_status ||
        "N/A",
      orderStatus:
        apiOrder.order_status ||
        "N/A",
      orderType:
        apiOrder.order_type ||
        "retail",
      amountPaid:
        apiOrder.amount_paid ||
        0,
      subtotal:
        apiOrder.subtotal || 0,
      totalGst:
        apiOrder.total_gst || 0,
      shippingCharge:
        apiOrder.shipping_charge ||
        0,
      userId:
        apiOrder.user?.id || 0,
      userEmail:
        apiOrder.user?.email ||
        "N/A",
      userPhone:
        apiOrder.user?.phone ||
        "N/A",
      shippingAddress:
        apiOrder.shipping_address
          ?.full_address || "N/A",
      trackingNumber:
        apiOrder.gateway_transaction_id ||
        "N/A",
      items:
        apiOrder.items?.map(
          (item: any) => ({
            id: String(
              item.line_id
            ),
            productName:
              item.product_name ||
              "N/A",
            sku:
              item.product_code ||
              "N/A",
            quantity:
              item.quantity,
            price: `₹${Number(
              item.unit_price || 0
            ).toLocaleString(
              "en-IN"
            )}`,
            total: `₹${Number(
              item.line_total || 0
            ).toLocaleString(
              "en-IN"
            )}`,
            status:
              item.delivery_status
                ?.charAt(0)
                .toUpperCase() +
                item.delivery_status?.slice(
                  1
                ) || "Pending",
            image:
              item.primary_image ||
              undefined,
          })
        ) || [],
    };
  };

  // ===================================================
  // UI ORDERS
  // ===================================================

  const uiOrders = useMemo(() => {
    return ordersData.map(
      (order, index) =>
        convertToOrder(
          order,
          index
        )
    );
  }, [ordersData]);

  // ===================================================
  // STATS
  // ===================================================

  const statsData = useMemo(() => {
    const total =
      uiOrders.length;

    const pending =
      uiOrders.filter(
        (o) =>
          o.orderStatus ===
          "pending"
      ).length;

    const confirmed =
      uiOrders.filter(
        (o) =>
          o.orderStatus ===
            "confirmed" ||
          o.orderStatus ===
            "processing"
      ).length;

    const delivered =
      uiOrders.filter(
        (o) =>
          o.orderStatus ===
            "delivered" ||
          o.orderStatus ===
            "partial_delivered"
      ).length;

    return [
      {
        title: "Total Orders",
        value: total,
        icon: (
          <span className="text-[#b8902e]">
            <ClipboardIcon />
          </span>
        ),
        barColor: "bg-[#b8902e]",
        textColor: "text-[#b8902e]",
        valueColor:
          "text-[#8f6d1d]",
      },
      {
        title: "Pending Orders",
        value: pending,
        icon: (
          <span className="text-[#c49b3a]">
            <ShoppingBagIcon />
          </span>
        ),
        barColor: "bg-[#c49b3a]",
        textColor:
          "text-[#a06f13]",
        valueColor:
          "text-[#8f6d1d]",
      },
      {
        title: "Confirmed Orders",
        value: confirmed,
        icon: (
          <span className="text-[#a8841c]">
            <CreditCardIcon />
          </span>
        ),
        barColor: "bg-[#a8841c]",
        textColor:
          "text-[#8f6d1d]",
        valueColor:
          "text-[#8f6d1d]",
      },
      {
        title: "Delivered Orders",
        value: delivered,
        icon: (
          <span className="text-[#806319]">
            <CheckCircleIcon />
          </span>
        ),
        barColor: "bg-[#806319]",
        textColor:
          "text-[#806319]",
        valueColor:
          "text-[#705813]",
      },
    ];
  }, [uiOrders]);

  // ===================================================
  // SELECT
  // ===================================================

  const handleSelectOrder = (
    order: Order
  ) => {
    setSelectedOrder(order);

    console.log(
      "Selected order:",
      order
    );
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-[#faf8f3] p-4">
      {/* PAGE HEADER */}

      <div className="mb-5">
        <div className="mb-1 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#b8902e]" />

          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8902e]">
            Order Management
          </span>
        </div>

        <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#2a2620] sm:text-[30px]">
          Orders
        </h1>

        <p className="mt-1 text-sm text-[#786f60]">
          Manage orders, payments, and fulfillment
          from one place.
        </p>
      </div>

      {/* STATS */}

      {loading ? (
        <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-[135px] animate-pulse rounded-2xl border border-[#b8902e]/10 bg-white"
              />
            )
          )}
        </div>
      ) : (
        <div className="mb-5">
          <StatsCard stats={statsData} />
        </div>
      )}

      {/* ORDERS TABLE */}

      <div className="min-w-0">
        <OrdersTable
          onSelectOrder={
            handleSelectOrder
          }
          selectedOrderId={
            selectedOrder?.id
          }
        />
      </div>
    </div>
  );
};

export default Orders;