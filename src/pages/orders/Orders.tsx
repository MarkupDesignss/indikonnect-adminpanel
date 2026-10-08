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
  FiSend,
  FiCheckCircle,
  FiFileText,
  FiDownload,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

import { orderApi } from "../../api/endpoints/orders";
import orderInvoiceApi from "../../api/endpoints/orderInvoice";

import GlobalModal from "@/components/common/GlobalModal";
import StatsCard from "@/components/common/StatsCard";
import { categoryApi } from "../../api/endpoints/category";
import brandsApi from "../../api/endpoints/brands";

import {
  downloadOrdersCsv,
  openInvoicePdfInNewTab,
} from "./csvUtils";

// =====================================================
// ✅ PERMISSIONS
// =====================================================

import { usePermissions } from "../../pages/permissions/usePermissions";

// =====================================================
// ICONS
// =====================================================

const ClipboardIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4H18C19.1046 4 20 4.89543 20 6V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V6C4 4.89543 4.89543 4 6 4H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 13H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 17H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CreditCardIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M2 10H22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M7 15H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9 12L11.5 14.5L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const DollarIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 8H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 12H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 16H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// =====================================================
// TYPES
// =====================================================

export interface OrderItem {
  id: string;
  invoiceNumber?: string;
  invoice_number?: string;
  shipmentNumber?: string;
  productName: string;
  sku: string;
  quantity: number;
  price: string;
  total: string;
  status: string;
  image?: string;
  lineId?: number;
  orderReference?: string;
  itemReferenceId?: string;
  delivery_status?: string;
  unitPrice?: number;
  lineTotal?: number;
  productId?: number;
  isReturnable?: number;
  availableForReturn?: number;
  gstRate?: number;
  gstAmount?: number;
  categoryId?: number | string;
  brandId?: number | string;
  is_cancel_return_allowed?: boolean;
  courier_tracking_number?: string;
  courierTrackingNumber?: string;
  invoice?: { id: number; invoice_number: string } | null;
}

export interface Order {
  id: string;
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
  orderId?: number;
  orderReference?: string;
  totalPayable?: number;
  shippingAddressFull?: string;
  courierCompany?: string;
  courierTrackingNumber?: string;
  courierDeliveryDate?: string;
  shippingDetails?: any;
  paymentGateway?: string;
  gatewayTransactionId?: string;
  categoryId?: number | string;
  brandId?: number | string;
}

// =====================================================
// PERMISSION LOADING STATE
// =====================================================

const PermissionLoadingState: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-6 font-poppins">
      <div className="w-full max-w-md rounded-2xl border border-[#D8E2F0] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
          <FiLoader size={24} className="animate-spin" />
        </div>

        <h2 className="mt-5 text-base font-bold text-[#0F1B3D]">
          Checking permissions...
        </h2>

        <p className="mt-2 text-sm text-[#8C97B2]">
          Please wait while we verify your access.
        </p>
      </div>
    </div>
  );
};

// =====================================================
// COMMON LOADER / ERROR — NAVY THEME
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
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
      {icon || <FiLoader size={27} className="animate-spin" />}
    </div>
    <p className="mt-4 text-sm font-semibold text-[#3A4668]">{message}</p>
    <p className="mt-1 text-xs text-[#8C97B2]">
      Please wait while the information is loaded.
    </p>
  </div>
);

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
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
      <FiAlertCircle size={27} />
    </div>
    <p className="mt-4 text-sm font-semibold text-[#C23B32]">
      {error || defaultMessage}
    </p>
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="mt-6 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.5)] transition hover:-translate-y-0.5"
      >
        Close
      </button>
    )}
  </div>
);

// =====================================================
// VIEW ORDER POPUP — NAVY THEME
// =====================================================

interface ViewOrderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  orderData?: any;
  onViewInvoice?: (orderId: number, itemId?: number) => void;
}

const ViewOrderPopup: React.FC<ViewOrderPopupProps> = ({
  isOpen,
  onClose,
  orderId,
  orderData,
  onViewInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<"items" | "details" | "tracking">("items");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      if (orderData) {
        setOrderDetails(orderData);
        setLoading(false);
        setError(null);
      } else {
        fetchOrderDetails(orderId);
      }
    }
    if (isOpen) setActiveTab("items");
  }, [isOpen, orderId, orderData]);

  const fetchOrderDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.getOrderDetails(id);
      let data = null;
      if (response?.data?.data) data = response.data.data;
      else if (response?.data) data = response.data;
      if (data) setOrderDetails(data);
      else setError("No data received from API");
    } catch (err) {
      setError("An error occurred while fetching order details");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlobalModal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#FACC15]" />
          <ModalLoader message="Loading order details..." />
        </div>
      </GlobalModal>
    );
  }

  if (error || !orderDetails) {
    return (
      <GlobalModal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#FACC15]" />
          <ModalError error={error || "Order not found"} onClose={onClose} />
        </div>
      </GlobalModal>
    );
  }

  const {
    user,
    items,
    payment,
    delivery_address,
    order_status,
    order_reference,
    order_date,
    shipping_address,
    shipping_details,
  } = orderDetails;

  const subtotal = orderDetails.subtotal || 0;
  const shippingCharge = orderDetails.shipping_charge || 0;
  const totalGst = orderDetails.total_gst || 0;
  const totalPayable = orderDetails.total_payable || 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const uiItems: OrderItem[] = (items || []).map((item: any) => ({
    id: String(item.line_id || ""),
    lineId: item.line_id,
    orderReference: item.order_reference || orderDetails?.order_reference || "N/A",
    itemReferenceId: item.item_reference_id || "N/A",
    productName: item.product_name || "N/A",
    sku: item.product_code || "N/A",
    quantity: item.quantity || 0,
    price: `₹${(item.unit_price || 0).toLocaleString("en-IN")}`,
    total: `₹${(item.line_total || 0).toLocaleString("en-IN")}`,
    unitPrice: item.unit_price || 0,
    lineTotal: item.line_total || 0,
    status: item.delivery_status
      ? item.delivery_status.charAt(0).toUpperCase() + item.delivery_status.slice(1)
      : "Pending",
    delivery_status: item.delivery_status || "pending",
    image: item.primary_image || undefined,
    productId: item.product_id,
    isReturnable: item.is_returnable,
    availableForReturn: item.available_for_return,
    gstRate: item.gst_rate,
    gstAmount: item.gst_amount,
    is_cancel_return_allowed: Boolean(item.is_cancel_return_allowed),
    courier_tracking_number: item.courier_tracking_number || undefined,
    courierTrackingNumber: item.courier_tracking_number || undefined,
  }));

  const getStatusBadge = (status: string) => {
    const lowerStatus = status?.toLowerCase() || "";
    switch (lowerStatus) {
      case "delivered":
      case "partial_delivered":
        return "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]";
      case "cancelled":
        return "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]";
      case "confirmed":
      case "processing":
      case "dispatched":
      case "shipped":
        return "border-[#2563EB]/30 bg-[#EAF1FF] text-[#2563EB]";
      case "pending":
      case "partial_return":
      case "partial_dispatched":
      case "partial_shipped":
      case "undelivered":
        return "border-[#FACC15]/40 bg-[#FEF9C3] text-[#8A6D16]";
      default:
        return "border-[#D8E2F0] bg-[#F3F6FB] text-[#4A5778]";
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return "N/A";
    return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getShippingAddress = () => {
    if (delivery_address) return delivery_address;
    if (shipping_address) return shipping_address;
    return null;
  };

  const addr = getShippingAddress();

  return (
    <GlobalModal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#FACC15]" />

        <div className="sticky top-0 z-10 border-b border-[#1E3A8A]/10 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">
                  Order Management
                </span>
              </div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#0F1B3D]">
                <FiPackage className="text-[#1E3A8A]" />
                Order Details
              </h2>
              <p className="mt-1 text-sm text-[#8C97B2]">
                {order_reference || "N/A"} • {formatDate(order_date)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/15 bg-[#F5F8FF] text-[#1E3A8A] transition hover:border-[#1E3A8A]/30 hover:bg-[#EAF1FF]"
            >
              <FiX size={19} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("items")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "items"
                  ? "bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                  : "bg-[#F5F8FF] text-[#4A5778] hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
              }`}
            >
              <FiPackage className="mr-1.5 inline" size={13} />
              Items ({items?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "details"
                  ? "bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                  : "bg-[#F5F8FF] text-[#4A5778] hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
              }`}
            >
              <FiUser className="mr-1.5 inline" size={13} />
              {orderDetails?.order_type === "retail" ? "Customer Details" : "Distributor Details"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tracking")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "tracking"
                  ? "bg-gradient-to-r from-[#1E40AF] to-[#1E3A8A] text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                  : "bg-[#F5F8FF] text-[#4A5778] hover:bg-[#EAF1FF] hover:text-[#1E3A8A]"
              }`}
            >
              <FiTruck className="mr-1.5 inline" size={13} />
              Tracking
            </button>
          </div>
        </div>

        <div className="max-h-[calc(95vh-190px)] overflow-y-auto p-5 sm:p-6">
          {activeTab === "items" && (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-[#1E3A8A]/15">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] border-collapse">
                    <thead>
                      <tr className="bg-[#1E3A8A]">
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">#</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">Item Reference</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">Product</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">SKU</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">Qty</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">Price</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">Total</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">Tracking No.</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">Status</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uiItems && uiItems.length > 0 ? (
                        uiItems.map((item, idx) => {
                          const isDelivered = item.delivery_status?.toLowerCase() === "delivered";
                          return (
                            <tr key={item.id} className="border-b border-[#1E3A8A]/10 transition hover:bg-[#FAFBFF]">
                              <td className="px-4 py-3 text-sm text-[#1E3A8A]">{idx + 1}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex rounded-lg bg-[#F5F8FF] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#3A4668]">
                                  {item.itemReferenceId || "N/A"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {item.image ? (
                                    <img src={item.image} alt={item.productName} className="h-10 w-10 rounded-xl border border-[#1E3A8A]/15 object-cover" />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                                      <FiPackage size={15} />
                                    </div>
                                  )}
                                  <span className="text-sm font-semibold text-[#0F1B3D]">{item.productName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="rounded-lg bg-[#F5F8FF] px-2.5 py-1 text-xs font-semibold text-[#4A5778]">{item.sku}</span>
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-[#3A4668]">{item.quantity}</td>
                              <td className="px-4 py-3 text-right text-sm text-[#4A5778]">{item.price}</td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-[#0F1B3D]">{item.total}</td>
                              <td className="px-4 py-3">
                                {item.courier_tracking_number ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EAF1FF] px-2.5 py-1 text-[11px] font-bold text-[#1E3A8A]">
                                    <FiTruck size={11} />
                                    {item.courier_tracking_number}
                                  </span>
                                ) : (
                                  <span className="text-xs text-[#8C97B2]">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusBadge(item.status)}`}>
                                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                  {getStatusText(item.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isDelivered && orderDetails?.id && onViewInvoice && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const oid = orderDetails?.id;
                                      if (oid) onViewInvoice(oid, item.lineId);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#EAF1FF] px-3 py-1.5 text-xs font-bold text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white"
                                  >
                                    <FiFileText size={13} />
                                    Invoice
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-sm text-[#8C97B2]">
                            No items found in this order
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#1E3A8A]/15 bg-[#F5F8FF] p-5">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#2563EB]/20" />
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
                  <h4 className="text-sm font-bold text-[#0F1B3D]">Order Summary</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8C97B2]">Subtotal</p>
                    <p className="mt-1 text-base font-bold text-[#0F1B3D]">₹{Number(subtotal || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8C97B2]">Shipping</p>
                    <p className="mt-1 text-base font-bold text-[#0F1B3D]">₹{Number(shippingCharge || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8C97B2]">Tax (GST)</p>
                    <p className="mt-1 text-base font-bold text-[#0F1B3D]">₹{Number(totalGst || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="rounded-xl border border-[#1E3A8A]/20 bg-gradient-to-br from-[#EAF1FF] to-[#DBEAFE] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#1E3A8A]">Total Payable</p>
                    <p className="mt-1 text-xl font-bold text-[#172554]">₹{Number(totalPayable || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                      <FiUser size={17} />
                    </div>
                    <h4 className="font-bold text-[#0F1B3D]">
                      {orderDetails?.order_type === "retail" ? "Customer Information" : "Distributor Information"}
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 border-b border-[#1E3A8A]/10 pb-2.5">
                      <span className="text-xs text-[#8C97B2]">Name</span>
                      <span className="text-right text-sm font-semibold text-[#0F1B3D]">{user?.name || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-[#1E3A8A]/10 pb-2.5">
                      <span className="text-xs text-[#8C97B2]">Email</span>
                      <span className="max-w-[65%] truncate text-right text-sm font-semibold text-[#0F1B3D]">{user?.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-[#1E3A8A]/10 pb-2.5">
                      <span className="text-xs text-[#8C97B2]">Phone</span>
                      <span className="text-right text-sm font-semibold text-[#0F1B3D]">{user?.phone || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-[#1E3A8A]/10 pb-2.5">
                      <span className="text-xs text-[#8C97B2]">Order Type</span>
                      <span className="text-sm font-semibold capitalize text-[#1E3A8A]">
                        {orderDetails?.order_type === "retail" ? "Customer" : orderDetails?.order_type || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-[#8C97B2]">Payment Status</span>
                      <span className="rounded-full border border-[#1E3A8A]/20 bg-white px-2.5 py-1 text-xs font-bold capitalize text-[#1E3A8A]">
                        {payment?.payment_status || orderDetails?.payment_status || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                      <FiMapPin size={17} />
                    </div>
                    <h4 className="font-bold text-[#0F1B3D]">Shipping Address</h4>
                  </div>
                  {addr ? (
                    <>
                      <p className="text-sm leading-6 text-[#3A4668]">{addr.full_address || "No address provided"}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-[#1E3A8A]/10 bg-white p-3 text-xs">
                        <div>
                          <span className="text-[#8C97B2]">Address Line 1:</span>
                          <span className="ml-1 font-semibold text-[#3A4668]">{addr.address_line_1 || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#8C97B2]">Address Line 2:</span>
                          <span className="ml-1 font-semibold text-[#3A4668]">{addr.address_line_2 || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#8C97B2]">City:</span>
                          <span className="ml-1 font-semibold text-[#3A4668]">{addr.city || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#8C97B2]">State:</span>
                          <span className="ml-1 font-semibold text-[#3A4668]">{addr.state || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#8C97B2]">Country:</span>
                          <span className="ml-1 font-semibold text-[#3A4668]">{addr.country || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#8C97B2]">Pincode:</span>
                          <span className="ml-1 font-semibold text-[#3A4668]">{addr.postal_code || addr.pincode || "N/A"}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#8C97B2]">No address provided</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                    <FiCalendar size={17} />
                  </div>
                  <h4 className="font-bold text-[#0F1B3D]">Order Timeline</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#1E3A8A]" />
                    <span className="text-xs text-[#8C97B2]">Order Placed:</span>
                    <span className="text-sm font-semibold text-[#3A4668]">{formatDate(order_date)}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#FACC15]" />
                    <span className="text-xs text-[#8C97B2]">Current Status:</span>
                    <span className="text-sm font-bold capitalize text-[#1E3A8A]">{getStatusText(order_status || "N/A")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tracking" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#1E3A8A]/10 bg-[#F5F8FF] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                    <FiTruck size={17} />
                  </div>
                  <h4 className="font-bold text-[#0F1B3D]">Tracking Information</h4>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                    <span className="text-xs text-[#8C97B2]">Order Status</span>
                    <span className="text-sm font-bold capitalize text-[#1E3A8A]">{getStatusText(order_status || "N/A")}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                    <span className="text-xs text-[#8C97B2]">Payment Gateway</span>
                    <span className="text-sm font-semibold text-[#0F1B3D]">{payment?.payment_gateway || orderDetails?.payment_gateway || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                    <span className="text-xs text-[#8C97B2]">Transaction ID</span>
                    <span className="max-w-[65%] truncate text-sm font-semibold text-[#0F1B3D]">
                      {payment?.gateway_transaction_id || orderDetails?.gateway_transaction_id || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                    <span className="text-xs text-[#8C97B2]">Amount Paid</span>
                    <span className="text-sm font-bold text-[#1E3A8A]">
                      ₹{Number(payment?.amount_paid || orderDetails?.amount_paid || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {(shipping_details || orderDetails?.courier_company) && (
                    <>
                      <div className="flex items-center justify-between rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                        <span className="text-xs text-[#8C97B2]">Courier Company</span>
                        <span className="text-sm font-semibold text-[#0F1B3D]">{shipping_details?.courier_company || orderDetails?.courier_company || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                        <span className="text-xs text-[#8C97B2]">Tracking Number</span>
                        <span className="text-sm font-semibold text-[#0F1B3D]">
                          {shipping_details?.courier_tracking_number || orderDetails?.courier_tracking_number || "N/A"}
                        </span>
                      </div>
                      {shipping_details?.courier_delivery_date && (
                        <div className="flex items-center justify-between rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                          <span className="text-xs text-[#8C97B2]">Expected Delivery</span>
                          <span className="text-sm font-semibold text-[#0F1B3D]">{formatDate(shipping_details.courier_delivery_date)}</span>
                        </div>
                      )}
                      {shipping_details?.delivery_notes && (
                        <div className="flex items-center justify-between rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                          <span className="text-xs text-[#8C97B2]">Delivery Notes</span>
                          <span className="text-sm font-semibold text-[#0F1B3D]">{shipping_details.delivery_notes}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end border-t border-[#1E3A8A]/10 bg-[#FAFBFF]/95 px-6 py-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.5)] transition hover:-translate-y-0.5"
          >
            Close
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// DISPATCH POPUP — NAVY THEME
// =====================================================

interface DispatchPopupProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  selectedItems?: OrderItem[];
  onDispatch: (trackingDetails: any) => void;
  isFullOrder?: boolean;
}

const DispatchPopup: React.FC<DispatchPopupProps> = ({
  isOpen,
  onClose,
  order,
  selectedItems = [],
  onDispatch,
  isFullOrder = false,
}) => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    if (isOpen) {
      setTrackingNumber("");
      setCourierName("");
      setExpectedDelivery("");
      setNotes("");
      setError(null);
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  const itemsToDispatch = (isFullOrder ? order.items || [] : selectedItems).filter(
    (item) => {
      const status = String(item.delivery_status || item.status || "pending")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
      return status === "confirmed";
    },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const dispatchData: any = {
        order_reference: order.id,
        courier_tracking_number: trackingNumber,
        courier_company: courierName,
        delivery_notes: notes || undefined,
        courier_delivery_date: expectedDelivery || undefined,
      };
      if (isFullOrder) {
        dispatchData.dispatch_all = true;
      } else {
        dispatchData.items = itemsToDispatch.map((item) => ({
          order_line_id: item.lineId || parseInt(item.id),
        }));
      }
      const response = await orderApi.dispatchOrder(dispatchData);
      if (response.data.success) {
        toast.success(`✅ Successfully dispatched ${itemsToDispatch.length} item(s)`);
        onDispatch({
          orderId: order.id,
          items: itemsToDispatch.map((item) => ({
            id: item.id,
            name: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            lineId: item.lineId || parseInt(item.id),
          })),
          itemCount: itemsToDispatch.length,
          trackingNumber,
          courierName,
          expectedDelivery,
          notes,
          isFullOrder,
        });
        onClose();
      } else {
        setError(response.data.message || "Failed to dispatch order");
        toast.error(response.data.message || "Failed to dispatch order");
      }
    } catch (err: any) {
      const errorMsg = err.message || "An error occurred while dispatching";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlobalModal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#FACC15]" />
        <div className="sticky top-0 z-10 border-b border-[#1E3A8A]/10 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">Fulfillment</span>
              </div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#0F1B3D]">
                <FiTruck className="text-[#1E3A8A]" />
                {isFullOrder ? "Dispatch Entire Order" : `Dispatch ${itemsToDispatch.length} Items`}
              </h2>
              <p className="mt-1 text-sm text-[#8C97B2]">
                {order.id} • {order.customer}
                {!isFullOrder && ` • ${itemsToDispatch.length} item(s) selected`}
                {isFullOrder && ` • All ${itemsToDispatch.length} item(s)`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/15 bg-[#F5F8FF] text-[#1E3A8A] transition hover:border-[#1E3A8A]/30 hover:bg-[#EAF1FF]"
            >
              <FiX size={19} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(95vh-180px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            {error && (
              <div className="rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] p-4 text-sm text-[#C23B32]">
                <FiAlertCircle className="mr-2 inline" size={16} />
                {error}
              </div>
            )}

            <div className="relative overflow-hidden rounded-2xl border border-[#1E3A8A]/15 bg-[#F5F8FF] p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#2563EB]/20" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">Order Total</span>
                  <p className="mt-1 text-lg font-bold text-[#0F1B3D]">{order.total}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">Items</span>
                  <p className="mt-1 text-lg font-bold text-[#1E3A8A]">
                    {itemsToDispatch.length}{" "}
                    <span className="text-xs font-semibold text-[#8C97B2]">
                      {isFullOrder ? "(All)" : "(Selected)"}
                    </span>
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">Shipping Address</span>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#3A4668]">{order.shippingAddress || "N/A"}</p>
                </div>
              </div>
              {isFullOrder && (
                <div className="mt-4 rounded-xl border border-[#1E3A8A]/15 bg-white p-3">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#1E3A8A]">
                    <FiPackage size={13} />
                    Dispatching all items in this order
                  </span>
                </div>
              )}
            </div>

            {itemsToDispatch.length > 0 && (
              <div className="rounded-2xl border border-[#1E3A8A]/15 bg-[#EAF1FF] p-5">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0F1B3D]">
                  <FiPackage className="text-[#1E3A8A]" />
                  {isFullOrder ? "All Items in Order" : "Selected Items to Dispatch"}
                </h4>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {itemsToDispatch.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="h-8 w-8 rounded-lg border border-[#1E3A8A]/10 object-cover flex-shrink-0" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1E3A8A] flex-shrink-0">
                            <FiPackage size={12} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#3A4668]">{item.productName}</span>
                          <span className="block truncate text-[10px] font-semibold text-[#2563EB]">Ref: {item.itemReferenceId || "N/A"}</span>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-[#8C97B2]">
                        Qty: {item.quantity} • SKU: {item.sku}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiTruck size={17} />
                </div>
                <h3 className="font-bold text-[#0F1B3D]">Tracking Details</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4A5778]">
                    Tracking Number <span className="text-[#C23B32]">*</span>
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="h-12 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-4 text-sm text-[#0F1B3D] outline-none transition-all placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4A5778]">
                    Courier Name <span className="text-[#C23B32]">*</span>
                  </label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="Enter courier name"
                    className="h-12 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-4 text-sm text-[#0F1B3D] outline-none transition-all placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4A5778]">Expected Delivery Date</label>
                <input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  min={minDate}
                  className="h-12 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-4 text-sm text-[#0F1B3D] outline-none transition-all focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4A5778]">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-4 py-3 text-sm text-[#0F1B3D] outline-none transition-all placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#1E3A8A]/10 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#1E3A8A]/20 bg-white px-4 py-3 text-sm font-semibold text-[#4A5778] transition hover:border-[#1E3A8A]/30 hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(30,58,138,0.7)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <FiLoader size={17} className="animate-spin" /> : <FiTruck size={17} />}
                {loading
                  ? "Processing..."
                  : isFullOrder
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
// SHIP POPUP — NAVY THEME
// =====================================================

interface ShipPopupProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  selectedItems?: OrderItem[];
  onShip: (data: any) => void;
  isFullOrder?: boolean;
}

const ShipPopup: React.FC<ShipPopupProps> = ({
  isOpen,
  onClose,
  order,
  selectedItems = [],
  onShip,
  isFullOrder = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  const itemsToShip = (isFullOrder ? order.items || [] : selectedItems).filter(
    (item) => {
      const status = String(item.delivery_status || item.status || "pending")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
      return status === "dispatched";
    },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const shipData: any = { order_reference: order.id };
      if (!isFullOrder) {
        shipData.items = itemsToShip.map((item) => ({
          order_line_id: item.lineId || parseInt(item.id),
        }));
      }
      const response = await orderApi.shipOrder(shipData);
      if (response.data.success) {
        toast.success(`✅ Successfully shipped ${itemsToShip.length} item(s)`);
        onShip({
          orderId: order.id,
          items: itemsToShip.map((item) => ({
            id: item.id,
            name: item.productName,
            lineId: item.lineId || parseInt(item.id),
          })),
          itemCount: itemsToShip.length,
          isFullOrder,
        });
        onClose();
      } else {
        setError(response.data.message || "Failed to ship order");
        toast.error(response.data.message || "Failed to ship order");
      }
    } catch (err: any) {
      const errorMsg = err.message || "An error occurred while shipping";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlobalModal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#FACC15]" />
        <div className="sticky top-0 z-10 border-b border-[#1E3A8A]/10 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">Shipment</span>
              </div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#0F1B3D]">
                <FiSend className="text-[#1E3A8A]" />
                {isFullOrder ? "Ship Entire Order" : `Ship ${itemsToShip.length} Items`}
              </h2>
              <p className="mt-1 text-sm text-[#8C97B2]">
                {order.id} • {order.customer}
                {!isFullOrder && ` • ${itemsToShip.length} item(s) selected`}
                {isFullOrder && ` • All ${itemsToShip.length} item(s)`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/15 bg-[#F5F8FF] text-[#1E3A8A] transition hover:border-[#1E3A8A]/30 hover:bg-[#EAF1FF]"
            >
              <FiX size={19} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(95vh-180px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            {error && (
              <div className="rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] p-4 text-sm text-[#C23B32]">
                <FiAlertCircle className="mr-2 inline" size={16} />
                {error}
              </div>
            )}
            <div className="relative overflow-hidden rounded-2xl border border-[#1E3A8A]/15 bg-[#F5F8FF] p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#2563EB]/20" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">Order Total</span>
                  <p className="mt-1 text-lg font-bold text-[#0F1B3D]">{order.total}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">Items</span>
                  <p className="mt-1 text-lg font-bold text-[#1E3A8A]">
                    {itemsToShip.length}{" "}
                    <span className="text-xs font-semibold text-[#8C97B2]">
                      {isFullOrder ? "(All)" : "(Selected)"}
                    </span>
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">Shipping Address</span>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#3A4668]">{order.shippingAddress || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1E3A8A]/15 bg-[#EAF1FF] p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0F1B3D]">
                <FiPackage className="text-[#1E3A8A]" />
                {isFullOrder ? "All Items in Order" : "Selected Items to Ship"}
              </h4>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {itemsToShip.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image ? (
                        <img src={item.image} alt={item.productName} className="h-8 w-8 rounded-lg border border-[#1E3A8A]/10 object-cover flex-shrink-0" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1E3A8A] flex-shrink-0">
                          <FiPackage size={12} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#3A4668]">{item.productName}</span>
                        <span className="block truncate text-[10px] font-semibold text-[#2563EB]">Ref: {item.itemReferenceId || "N/A"}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-[#8C97B2]">Qty: {item.quantity} • SKU: {item.sku}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#1E3A8A]/10 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#1E3A8A]/20 bg-white px-4 py-3 text-sm font-semibold text-[#4A5778] transition hover:border-[#1E3A8A]/30 hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <FiLoader size={17} className="animate-spin" /> : <FiSend size={17} />}
                {loading
                  ? "Processing..."
                  : isFullOrder
                    ? `Ship Entire Order (${itemsToShip.length} items)`
                    : `Ship ${itemsToShip.length} Items`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// DELIVER POPUP — NAVY THEME
// =====================================================

interface DeliverPopupProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  selectedItems?: OrderItem[];
  onDeliver: (data: any) => void;
  isFullOrder?: boolean;
}

const DeliverPopup: React.FC<DeliverPopupProps> = ({
  isOpen,
  onClose,
  order,
  selectedItems = [],
  onDeliver,
  isFullOrder = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  const itemsToDeliver = isFullOrder ? order.items || [] : selectedItems;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const deliverData: any = { order_reference: order.id };
      if (!isFullOrder) {
        deliverData.items = itemsToDeliver.map((item) => ({
          order_line_id: item.lineId || parseInt(item.id),
        }));
      }
      const response = await orderApi.deliverOrder(deliverData);
      if (response.data.success) {
        toast.success(`✅ Successfully delivered ${itemsToDeliver.length} item(s)`);
        onDeliver({
          orderId: order.id,
          items: itemsToDeliver.map((item) => ({
            id: item.id,
            name: item.productName,
            lineId: item.lineId || parseInt(item.id),
          })),
          itemCount: itemsToDeliver.length,
          isFullOrder,
        });
        onClose();
      } else {
        setError(response.data.message || "Failed to deliver order");
        toast.error(response.data.message || "Failed to deliver order");
      }
    } catch (err: any) {
      const errorMsg = err.message || "An error occurred while delivering";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlobalModal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#FACC15]" />
        <div className="sticky top-0 z-10 border-b border-[#1E3A8A]/10 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">Delivery</span>
              </div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#0F1B3D]">
                <FiCheckCircle className="text-[#1E3A8A]" />
                {isFullOrder ? "Deliver Entire Order" : `Deliver ${itemsToDeliver.length} Items`}
              </h2>
              <p className="mt-1 text-sm text-[#8C97B2]">
                {order.id} • {order.customer}
                {!isFullOrder && ` • ${itemsToDeliver.length} item(s) selected`}
                {isFullOrder && ` • All ${itemsToDeliver.length} item(s)`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/15 bg-[#F5F8FF] text-[#1E3A8A] transition hover:border-[#1E3A8A]/30 hover:bg-[#EAF1FF]"
            >
              <FiX size={19} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(95vh-180px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            {error && (
              <div className="rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] p-4 text-sm text-[#C23B32]">
                <FiAlertCircle className="mr-2 inline" size={16} />
                {error}
              </div>
            )}
            <div className="relative overflow-hidden rounded-2xl border border-[#1E3A8A]/15 bg-[#F5F8FF] p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#2563EB]/20" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">Order Total</span>
                  <p className="mt-1 text-lg font-bold text-[#0F1B3D]">{order.total}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">Items</span>
                  <p className="mt-1 text-lg font-bold text-[#1E3A8A]">
                    {itemsToDeliver.length}{" "}
                    <span className="text-xs font-semibold text-[#8C97B2]">
                      {isFullOrder ? "(All)" : "(Selected)"}
                    </span>
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#8C97B2]">Shipping Address</span>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#3A4668]">{order.shippingAddress || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1E3A8A]/15 bg-[#EAF1FF] p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0F1B3D]">
                <FiPackage className="text-[#1E3A8A]" />
                {isFullOrder ? "All Items in Order" : "Selected Items to Deliver"}
              </h4>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {itemsToDeliver.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#1E3A8A]/10 bg-white p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image ? (
                        <img src={item.image} alt={item.productName} className="h-8 w-8 rounded-lg border border-[#1E3A8A]/10 object-cover flex-shrink-0" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1E3A8A] flex-shrink-0">
                          <FiPackage size={12} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#3A4668]">{item.productName}</span>
                        <span className="block truncate text-[10px] font-semibold text-[#2563EB]">Ref: {item.itemReferenceId || "N/A"}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-[#8C97B2]">Qty: {item.quantity} • SKU: {item.sku}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#1E3A8A]/10 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#1E3A8A]/20 bg-white px-4 py-3 text-sm font-semibold text-[#4A5778] transition hover:border-[#1E3A8A]/30 hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.6)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <FiLoader size={17} className="animate-spin" /> : <FiCheckCircle size={17} />}
                {loading
                  ? "Processing..."
                  : isFullOrder
                    ? `Deliver Entire Order (${itemsToDeliver.length} items)`
                    : `Deliver ${itemsToDeliver.length} Items`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </GlobalModal>
  );
};

// =====================================================
// ORDERS TABLE — NAVY THEME + PERMISSIONS
// =====================================================

interface OrdersTableProps {
  onSelectOrder: (order: Order) => void;
  selectedOrderId?: string;
  onFilteredChange?: (orders: Order[], label: string) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  onSelectOrder,
  selectedOrderId,
  onFilteredChange,
}) => {
  // ===================================================
  // ✅ PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
  } = usePermissions();

  const canViewOrders = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("order") ||
      hasPermission("order.view"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canDispatch = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("order.dispatch"),
    [isSuperAdmin, hasPermission],
  );

  const canShip = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("order.shipped") ||
      hasPermission("order.ship"),
    [isSuperAdmin, hasPermission],
  );

  const canDeliver = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("order.delivered") ||
      hasPermission("order.deliver"),
    [isSuperAdmin, hasPermission],
  );

  const canMarkUndelivered = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("order.undelivered") ||
      hasPermission("order.delivered"),
    [isSuperAdmin, hasPermission],
  );

  const canToggleCancelReturn = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("order.update") ||
      hasPermission("order.details"),
    [isSuperAdmin, hasPermission],
  );

  const canViewInvoice = useMemo(
    () =>
      isSuperAdmin ||
      hasPermission("order.details") ||
      hasPermission("order.invoice"),
    [isSuperAdmin, hasPermission],
  );

  // ===================================================
  // STATE
  // ===================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Status: All");
  const [categoryFilter, setCategoryFilter] = useState("Category: All");
  const [brandFilter, setBrandFilter] = useState("Brand: All");
  const [orderTypeFilter, setOrderTypeFilter] = useState("Order Type: All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [showDispatchPopup, setShowDispatchPopup] = useState(false);
  const [showShipPopup, setShowShipPopup] = useState(false);
  const [showDeliverPopup, setShowDeliverPopup] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState<string | null>(null);
  const [selectedOrderDataForView, setSelectedOrderDataForView] = useState<any>(null);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<Order | null>(null);
  const [selectedOrderForShip, setSelectedOrderForShip] = useState<Order | null>(null);
  const [selectedOrderForDeliver, setSelectedOrderForDeliver] = useState<Order | null>(null);
  const [selectedItemsForDispatch, setSelectedItemsForDispatch] = useState<OrderItem[]>([]);
  const [selectedItemsForShip, setSelectedItemsForShip] = useState<OrderItem[]>([]);
  const [selectedItemsForDeliver, setSelectedItemsForDeliver] = useState<OrderItem[]>([]);
  const [selectedItemsMap, setSelectedItemsMap] = useState<Map<string, boolean>>(new Map());
  const [isFullOrderDispatch, setIsFullOrderDispatch] = useState(false);
  const [isFullOrderShip, setIsFullOrderShip] = useState(false);
  const [isFullOrderDeliver, setIsFullOrderDeliver] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: number; title: string }[]>([]);
  const [brands, setBrands] = useState<{ id: number; title: string }[]>([]);

  const [togglingCancelReturn, setTogglingCancelReturn] = useState<Set<string>>(new Set());
  const [markingUndelivered, setMarkingUndelivered] = useState<Set<string>>(new Set());

  const itemsPerPage = 6;

useEffect(() => {
  fetchOrders();
  fetchStatuses();
  fetchCategories();
  fetchBrands();
}, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      if (response.data.success) {
        setCategories(
          (response.data.data || []).map((c: any) => ({ id: c.id, title: c.title })),
        );
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await brandsApi.getAll();
      if (response.data.success) {
        setBrands(
          (response.data.data || []).map((b: any) => ({ id: b.id, title: b.title })),
        );
      }
    } catch (err) {
      console.error("Failed to fetch brands:", err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.getOrders();
      const data = response.data.data || [];
      const extractedOrders = data.map((item: any) => item.order);
      setOrders(extractedOrders);
    } catch (err) {
      setError("An error occurred while fetching orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await orderApi.getOrderStatuses();
      if (response.data.success) {
        setAvailableStatuses(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch order statuses:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    const lowerStatus = status?.toLowerCase() || "";
    switch (lowerStatus) {
      case "delivered":
      case "partial_delivered":
        return "border-[#1E3A8A]/25 bg-[#EAF1FF] text-[#1E3A8A]";
      case "cancelled":
        return "border-[#C23B32]/25 bg-[#FBEAEA] text-[#C23B32]";
      case "confirmed":
      case "processing":
      case "dispatched":
      case "shipped":
        return "border-[#2563EB]/30 bg-[#EAF1FF] text-[#2563EB]";
      case "pending":
      case "partial_return":
      case "partial_dispatched":
      case "partial_shipped":
      case "undelivered":
        return "border-[#FACC15]/40 bg-[#FEF9C3] text-[#8A6D16]";
      default:
        return "border-[#D8E2F0] bg-[#F3F6FB] text-[#4A5778]";
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return "N/A";
    return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatOrderType = (type: string) => {
    if (!type) return "N/A";
    return type.toLowerCase() === "retail" ? "Customer" : formatStatus(type);
  };

  const convertToOrder = (apiOrder: any, index: number): Order => {
    return {
      id: apiOrder.order_reference,
      orderId: apiOrder.id,
      orderReference: apiOrder.order_reference,
      date: apiOrder.order_date
        ? new Date(apiOrder.order_date).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "N/A",
      customer: apiOrder.user?.name || "N/A",
      customerName: apiOrder.user?.name || "N/A",
      total: `₹${Number(apiOrder.total_payable || 0).toLocaleString("en-IN")}`,
      totalPayable: Number(apiOrder.total_payable || 0),
      paymentStatus: apiOrder.payment_status || "N/A",
      orderStatus: apiOrder.order_status || "N/A",
      orderType: apiOrder.order_type || "retail",
      amountPaid: apiOrder.amount_paid || 0,
      subtotal: apiOrder.subtotal || 0,
      totalGst: apiOrder.total_gst || 0,
      shippingCharge: apiOrder.shipping_charge || 0,
      userId: apiOrder.user?.id || 0,
      userEmail: apiOrder.user?.email || "N/A",
      userPhone: apiOrder.user?.phone || "N/A",
      shippingAddress: apiOrder.shipping_address?.full_address || "N/A",
      shippingAddressFull: apiOrder.shipping_address?.full_address || "N/A",
      trackingNumber: apiOrder.gateway_transaction_id || "N/A",
      paymentGateway: apiOrder.payment_gateway || undefined,
      gatewayTransactionId: apiOrder.gateway_transaction_id || undefined,
      courierCompany: apiOrder.courier_company || undefined,
      courierTrackingNumber: apiOrder.courier_tracking_number || undefined,
      courierDeliveryDate: apiOrder.courier_delivery_date || undefined,
      shippingDetails: apiOrder.shipping_details || undefined,
      items:
        apiOrder.items?.map((item: any) => ({
          id: String(item.line_id || item.id || ""),
          lineId: item.line_id || item.id,
          orderReference: item.order_reference || apiOrder.order_reference || "N/A",
          itemReferenceId: item.item_reference_id || "N/A",
          productName: item.product_name || "N/A",
          sku: item.product_code || "N/A",
          quantity: item.quantity || 0,
          price: `₹${Number(item.unit_price || 0).toLocaleString("en-IN")}`,
          total: `₹${Number(item.line_total || 0).toLocaleString("en-IN")}`,
          unitPrice: item.unit_price || 0,
          lineTotal: item.line_total || 0,
          status:
            item.delivery_status?.charAt(0).toUpperCase() +
              item.delivery_status?.slice(1) || "Pending",
          delivery_status: item.delivery_status || "pending",
          image: item.primary_image || item.product_image || undefined,
          productId: item.product_id,
          isReturnable: item.is_returnable,
          availableForReturn: item.available_for_return,
          gstRate: item.gst_rate,
          gstAmount: item.gst_amount,
          categoryId: item.category_id,
          brandId: item.brand_id,
          is_cancel_return_allowed: Boolean(item.is_cancel_return_allowed),
          courier_tracking_number: item.courier_tracking_number || undefined,
          courierTrackingNumber: item.courier_tracking_number || undefined,
          invoiceNumber: item.invoice?.invoice_number || undefined,
          invoice_number: item.invoice?.invoice_number || undefined,
        })) || [],
    };
  };

  const uiOrders = useMemo(() => {
    return orders.map((order, index) => convertToOrder(order, index));
  }, [orders]);

  const getFilterStatusValue = (filter: string) => {
    if (filter === "Status: All") return null;
    return filter.replace("Status: ", "").trim().toLowerCase();
  };

  const getItemStatus = (item: OrderItem) => {
    const rawStatus = item.delivery_status || item.status || "pending";
    return String(rawStatus).trim().toLowerCase().replace(/\s+/g, "_");
  };

  const normalizePhone = (phone: string) => String(phone || "").replace(/\D/g, "");

  const isItemLevelFilterActive = useMemo(() => {
    return (
      search.trim() !== "" ||
      getFilterStatusValue(statusFilter) !== null ||
      categoryFilter !== "Category: All" ||
      brandFilter !== "Brand: All" ||
      orderTypeFilter !== "Order Type: All"
    );
  }, [search, statusFilter, categoryFilter, brandFilter, orderTypeFilter]);

  const filteredOrders = useMemo(() => {
    const searchText = search.toLowerCase().trim();
    const searchDigits = normalizePhone(searchText);
    const filterStatusValue = getFilterStatusValue(statusFilter);
    const categoryValue =
      categoryFilter === "Category: All"
        ? null
        : categoryFilter.replace("Category: ", "");
    const brandValue =
      brandFilter === "Brand: All"
        ? null
        : brandFilter.replace("Brand: ", "");
    const orderTypeValue =
      orderTypeFilter === "Order Type: All"
        ? null
        : orderTypeFilter.replace("Order Type: ", "");

    const orderMatchesSearch = (order: Order): boolean => {
      if (!searchText) return true;
      const phoneDigits = normalizePhone(order.userPhone);
      const phoneMatch =
        searchDigits.length > 0 && phoneDigits.includes(searchDigits);

      return (
        phoneMatch ||
        (order.id || "").toLowerCase().includes(searchText) ||
        (order.customer || "").toLowerCase().includes(searchText) ||
        (order.customerName || "").toLowerCase().includes(searchText) ||
        (order.userEmail || "").toLowerCase().includes(searchText) ||
        (order.gatewayTransactionId || "").toLowerCase().includes(searchText) ||
        (order.trackingNumber || "").toLowerCase().includes(searchText)
      );
    };

    const itemMatchesSearch = (item: OrderItem, order: Order): boolean => {
      if (!searchText) return true;
      const phoneDigits = normalizePhone(order.userPhone);
      const phoneMatch =
        searchDigits.length > 0 && phoneDigits.includes(searchDigits);

      return (
        phoneMatch ||
        (item.productName || "").toLowerCase().includes(searchText) ||
        (item.sku || "").toLowerCase().includes(searchText) ||
        (item.itemReferenceId || "").toLowerCase().includes(searchText) ||
        String((item as any).courier_tracking_number || "")
          .toLowerCase()
          .includes(searchText) ||
        String((item as any).courierTrackingNumber || "")
          .toLowerCase()
          .includes(searchText) ||
        String((item as any).invoiceNumber || "")
          .toLowerCase()
          .includes(searchText) ||
        String((item as any).invoice_number || "")
          .toLowerCase()
          .includes(searchText) ||
        (order.id || "").toLowerCase().includes(searchText) ||
        (order.customer || "").toLowerCase().includes(searchText) ||
        (order.userEmail || "").toLowerCase().includes(searchText) ||
        (order.gatewayTransactionId || "").toLowerCase().includes(searchText) ||
        (order.trackingNumber || "").toLowerCase().includes(searchText)
      );
    };

    const result: Order[] = [];

    uiOrders.forEach((order) => {
      if (orderTypeValue !== null && order.orderType !== orderTypeValue) return;

      const orderStatusNormalized = String(order.orderStatus || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

      const orderStatusMatches =
        filterStatusValue === null ||
        orderStatusNormalized === filterStatusValue ||
        (order.items || []).some((it) => getItemStatus(it) === filterStatusValue);

      const orderLevelMatch = orderMatchesSearch(order) && orderStatusMatches;

      const itemMatches = (item: OrderItem): boolean => {
        if (!itemMatchesSearch(item, order)) return false;

        if (filterStatusValue !== null) {
          const itemStatus = getItemStatus(item);
          const orderMatches = orderStatusNormalized === filterStatusValue;
          if (!orderMatches && itemStatus !== filterStatusValue) return false;
        }

        if (
          categoryValue !== null &&
          String(item.categoryId ?? "") !== String(categoryValue)
        ) {
          return false;
        }

        if (
          brandValue !== null &&
          String(item.brandId ?? "") !== String(brandValue)
        ) {
          return false;
        }

        return true;
      };

      if (!isItemLevelFilterActive) {
        if (orderLevelMatch) result.push(order);
        return;
      }

      const matchingItems = (order.items || []).filter(itemMatches);

      if (matchingItems.length > 0) {
        matchingItems.forEach((item) => {
          result.push({ ...order, items: [item] });
        });
      } else if (
        (!order.items || order.items.length === 0) &&
        orderLevelMatch &&
        categoryValue === null &&
        brandValue === null
      ) {
        result.push(order);
      }
    });

    return result;
  }, [
    uiOrders,
    search,
    statusFilter,
    categoryFilter,
    brandFilter,
    orderTypeFilter,
    isItemLevelFilterActive,
  ]);

  const activeFilterLabel = useMemo(() => {
    const parts: string[] = [];
    if (orderTypeFilter !== "Order Type: All") {
      const t = orderTypeFilter.replace("Order Type: ", "");
      parts.push(t === "retail" ? "Customers" : "Distributors");
    }
    if (statusFilter !== "Status: All") {
      parts.push(formatStatus(statusFilter.replace("Status: ", "")));
    }
    if (categoryFilter !== "Category: All") {
      const cat = categories.find(
        (c) => String(c.id) === categoryFilter.replace("Category: ", ""),
      );
      if (cat) parts.push(cat.title);
    }
    if (brandFilter !== "Brand: All") {
      const br = brands.find(
        (b) => String(b.id) === brandFilter.replace("Brand: ", ""),
      );
      if (br) parts.push(br.title);
    }
    if (search.trim()) parts.push("Search");
    return parts.length > 0 ? parts.join(" • ") : "All Orders";
  }, [orderTypeFilter, statusFilter, categoryFilter, brandFilter, search, categories, brands]);

  useEffect(() => {
    if (onFilteredChange) {
      onFilteredChange(filteredOrders, activeFilterLabel);
    }
  }, [filteredOrders, activeFilterLabel, onFilteredChange]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));

  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const isItemWiseView = isItemLevelFilterActive;

  const changePage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("Status: All");
    setCategoryFilter("Category: All");
    setBrandFilter("Brand: All");
    setOrderTypeFilter("Order Type: All");
    setCurrentPage(1);
  };

  const hasActiveFilters = isItemLevelFilterActive;

  const toggleRow = (orderId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) newExpanded.delete(orderId);
    else newExpanded.add(orderId);
    setExpandedRows(newExpanded);
  };

  const handleViewOrder = (orderId: string) => {
    const apiOrder = orders.find((o) => o.order_reference === orderId);
    if (apiOrder) {
      setSelectedOrderForView(apiOrder.order_reference);
      setSelectedOrderDataForView(apiOrder);
      setShowViewPopup(true);
      const uiOrder = uiOrders.find((o) => o.id === orderId);
      if (uiOrder) onSelectOrder(uiOrder);
    }
  };

  const handleOpenInvoicePdf = async (orderId: number, itemId?: number) => {
    try {
      toast.loading("Generating invoice PDF...", { id: "invoice-pdf" });
      const response = await orderInvoiceApi.getByOrderId(orderId);
      toast.dismiss("invoice-pdf");
      if (response.data.success && response.data.data) {
        openInvoicePdfInNewTab(response.data.data, itemId ?? null);
      } else {
        toast.error(response.data.message || "Failed to fetch invoice data");
      }
    } catch (err: any) {
      toast.dismiss("invoice-pdf");
      console.error("Invoice fetch error:", err);
      toast.error(err?.response?.data?.message || "Failed to load invoice.");
    }
  };

  const isItemSelectable = (item: OrderItem) => {
    return canItemDispatch(item) || canItemShip(item) || canItemDeliver(item);
  };

  const toggleItemSelection = (orderId: string, itemId: string) => {
    const key = `${orderId}-${itemId}`;
    const newMap = new Map(selectedItemsMap);
    newMap.set(key, !newMap.get(key));
    setSelectedItemsMap(newMap);
  };

  const toggleAllItems = (orderId: string, items: OrderItem[]) => {
    if (items.length === 0) return;
    const selectableItems = items.filter((item) => isItemSelectable(item));
    if (selectableItems.length === 0) return;
    const allSelected = selectableItems.every((item) =>
      selectedItemsMap.get(`${orderId}-${item.id}`),
    );
    const newMap = new Map(selectedItemsMap);
    selectableItems.forEach((item) => {
      newMap.set(`${orderId}-${item.id}`, !allSelected);
    });
    setSelectedItemsMap(newMap);
  };

  const getSelectedItemsForOrder = (orderId: string, items: OrderItem[]) => {
    return items.filter((item) => selectedItemsMap.get(`${orderId}-${item.id}`));
  };

  const getSelectedCount = (orderId: string, items: OrderItem[]) =>
    getSelectedItemsForOrder(orderId, items).length;

  const allSelectableSelected = (orderId: string, items: OrderItem[]) => {
    const selectable = items.filter((item) => isItemSelectable(item));
    if (selectable.length === 0) return false;
    return selectable.every((item) => selectedItemsMap.get(`${orderId}-${item.id}`));
  };

  const canItemDispatch = (item: OrderItem) => getItemStatus(item) === "confirmed";
  const canItemShip = (item: OrderItem) => getItemStatus(item) === "dispatched";

  const canItemDeliver = (item: OrderItem) => {
    const s = getItemStatus(item);
    return s === "shipped" || s === "undelivered";
  };

  const canItemMarkUndelivered = (item: OrderItem) => getItemStatus(item) === "shipped";

  const isFullyDelivered = (item: OrderItem) => getItemStatus(item) === "delivered";

  const getSelectedDispatchableCount = (order: Order) => {
    return getSelectedItemsForOrder(order.id, order.items || []).filter(canItemDispatch).length;
  };

  const hasDispatchableItems = (order: Order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.some((item) => canItemDispatch(item));
  };
  const hasShipableItems = (order: Order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.some((item) => canItemShip(item));
  };
  const hasDeliverableItems = (order: Order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.some((item) => canItemDeliver(item));
  };
  const allItemsDispatchable = (order: Order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.every((item) => canItemDispatch(item));
  };
  const allItemsShipable = (order: Order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.every((item) => canItemShip(item));
  };
  const allItemsDeliverable = (order: Order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.every((item) => canItemDeliver(item));
  };
  const getDispatchableItemsCount = (order: Order) => {
    if (!order.items) return 0;
    return order.items.filter((item) => canItemDispatch(item)).length;
  };
  const getShipableItemsCount = (order: Order) => {
    if (!order.items) return 0;
    return order.items.filter((item) => canItemShip(item)).length;
  };
  const getDeliverableItemsCount = (order: Order) => {
    if (!order.items) return 0;
    return order.items.filter((item) => canItemDeliver(item)).length;
  };

  const handleDispatchSelected = (order: Order) => {
    const selectedItems = getSelectedItemsForOrder(order.id, order.items || []).filter(canItemDispatch);
    if (selectedItems.length === 0) {
      toast.error("Please select at least one confirmed item to dispatch.");
      return;
    }
    setIsFullOrderDispatch(false);
    setSelectedOrderForDispatch(order);
    setSelectedItemsForDispatch(selectedItems);
    setShowDispatchPopup(true);
  };

  const handleDispatchFromSelection = (order: Order) => {
    const selectedDispatchableCount = getSelectedDispatchableCount(order);
    if (selectedDispatchableCount > 0) {
      handleDispatchSelected(order);
      return;
    }
    handleDispatchFullOrder(order);
  };

  const handleDispatchFullOrder = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      toast.error("This order has no items to dispatch.");
      return;
    }
    const dispatchableItems = order.items.filter(canItemDispatch);
    if (dispatchableItems.length === 0) {
      toast.error("No confirmed items available for dispatch in this order.");
      return;
    }
    const allItemsAreConfirmed = dispatchableItems.length === order.items.length;
    setIsFullOrderDispatch(allItemsAreConfirmed);
    setSelectedOrderForDispatch(order);
    setSelectedItemsForDispatch(allItemsAreConfirmed ? [] : dispatchableItems);
    setShowDispatchPopup(true);
  };

  const handleDispatchSubmit = () => {
    fetchOrders();
    setSelectedItemsMap(new Map());
  };

  const handleShipFullOrder = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      toast.error("This order has no items to ship.");
      return;
    }
    const shipableItems = order.items.filter(canItemShip);
    if (shipableItems.length === 0) {
      toast.error("No dispatched items available for shipping in this order.");
      return;
    }
    const allItemsAreDispatched = shipableItems.length === order.items.length;
    setIsFullOrderShip(allItemsAreDispatched);
    setSelectedOrderForShip(order);
    setSelectedItemsForShip(allItemsAreDispatched ? [] : shipableItems);
    setShowShipPopup(true);
  };

  const handleShipSubmit = () => {
    fetchOrders();
    setSelectedItemsMap(new Map());
  };

  const handleDeliverFullOrder = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      toast.error("This order has no items to deliver.");
      return;
    }
    const deliverableItems = order.items.filter(canItemDeliver);
    if (deliverableItems.length === 0) {
      toast.error("No shipped items available for delivery in this order.");
      return;
    }
    const allItemsAreShipped = deliverableItems.length === order.items.length;
    setIsFullOrderDeliver(allItemsAreShipped);
    setSelectedOrderForDeliver(order);
    setSelectedItemsForDeliver(allItemsAreShipped ? [] : deliverableItems);
    setShowDeliverPopup(true);
  };

  const handleDeliverSubmit = () => {
    fetchOrders();
    setSelectedItemsMap(new Map());
  };

  const handleToggleCancelReturn = async (order: Order, item: OrderItem) => {
    const lineId = item.lineId || parseInt(item.id);
    if (!lineId || isNaN(lineId)) {
      toast.error("Invalid order line ID");
      return;
    }

    const key = `${order.id}-${item.id}`;
    const currentValue = Boolean(item.is_cancel_return_allowed);
    const newValue = !currentValue;

    setTogglingCancelReturn((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    try {
      const response = await orderApi.toggleCancelReturn(lineId, newValue);

      if (response.data.success) {
        toast.success(
          newValue
            ? "Cancel/Return option activated"
            : "Cancel/Return option deactivated",
        );

        setOrders((prevOrders) =>
          prevOrders.map((o) => {
            if (o.order_reference !== order.orderReference) return o;
            return {
              ...o,
              items: (o.items || []).map((it: any) => {
                const itLineId = it.line_id || it.id;
                if (itLineId !== lineId) return it;
                return { ...it, is_cancel_return_allowed: newValue };
              }),
            };
          }),
        );
      } else {
        toast.error(response.data.message || "Failed to update");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to update cancel/return option");
    } finally {
      setTogglingCancelReturn((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleMarkUndelivered = async (order: Order, item: OrderItem) => {
    const lineId = item.lineId || parseInt(item.id);
    if (!lineId || isNaN(lineId)) {
      toast.error("Invalid order line ID");
      return;
    }

    const key = `${order.id}-${item.id}`;

    setMarkingUndelivered((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    setOrders((prevOrders) =>
      prevOrders.map((o) => {
        if (o.order_reference !== order.orderReference) return o;
        return {
          ...o,
          items: (o.items || []).map((it: any) => {
            const itLineId = it.line_id || it.id;
            if (itLineId !== lineId) return it;
            return { ...it, delivery_status: "undelivered" };
          }),
        };
      }),
    );

    try {
      const response = await orderApi.markUndelivered(lineId);
      if (response.data.success) {
        toast.success("Item marked as undelivered");
        await fetchOrders();
        setSelectedItemsMap(new Map());
      } else {
        toast.error(response.data.message || "Failed to mark as undelivered");
        await fetchOrders();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to mark as undelivered",
      );
      await fetchOrders();
    } finally {
      setMarkingUndelivered((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const closeViewPopup = () => {
    setShowViewPopup(false);
    setSelectedOrderForView(null);
    setSelectedOrderDataForView(null);
  };
  const closeDispatchPopup = () => {
    setShowDispatchPopup(false);
    setSelectedOrderForDispatch(null);
    setSelectedItemsForDispatch([]);
    setIsFullOrderDispatch(false);
  };
  const closeShipPopup = () => {
    setShowShipPopup(false);
    setSelectedOrderForShip(null);
    setSelectedItemsForShip([]);
    setIsFullOrderShip(false);
  };
  const closeDeliverPopup = () => {
    setShowDeliverPopup(false);
    setSelectedOrderForDeliver(null);
    setSelectedItemsForDeliver([]);
    setIsFullOrderDeliver(false);
  };


  if (loading) {
    return (
      <div className="rounded-2xl border border-[#E3E9F5] bg-white p-10 shadow-sm">
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
            <FiLoader size={28} className="animate-spin" />
          </div>
          <p className="mt-4 text-sm font-bold text-[#0F1B3D]">Loading orders...</p>
          <p className="mt-1 text-xs text-[#8C97B2]">
            Please wait while we fetch your orders.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#C23B32]/15 bg-white p-10 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
            <FiAlertCircle size={27} />
          </div>
          <p className="mt-4 text-sm font-bold text-[#C23B32]">{error}</p>
          <button
            type="button"
            onClick={fetchOrders}
            className="mt-5 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.5)] transition hover:-translate-y-0.5"
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
        {/* FILTER BAR */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white p-4 shadow-sm sm:p-5">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#2563EB]/20" />

          <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1 lg:flex-[2]">
              <FiSearch
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1E3A8A]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Order ID, Mobile, Invoice, Tracking No., Product, SKU..."
                className="h-11 w-full rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] pl-10 pr-9 text-xs text-[#0F1B3D] outline-none transition-all placeholder:text-[#8C97B2] focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C97B2] transition hover:text-[#1E3A8A]"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-[140px]">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-3 pr-8 text-xs text-[#3A4668] outline-none transition-all focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
                >
                  <option>Status: All</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
                <FiChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C97B2]"
                  size={14}
                />
              </div>

              <div className="relative w-[140px]">
                <select
                  value={orderTypeFilter}
                  onChange={(e) => {
                    setOrderTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-3 pr-8 text-xs text-[#3A4668] outline-none transition-all focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
                >
                  <option>Order Type: All</option>
                  <option value="Order Type: retail">Customer</option>
                  <option value="Order Type: distributor">Distributor</option>
                </select>
                <FiChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C97B2]"
                  size={14}
                />
              </div>

              <div className="relative w-[140px]">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-3 pr-8 text-xs text-[#3A4668] outline-none transition-all focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
                >
                  <option>Category: All</option>
                  {categories.map((c) => (
                    <option key={c.id} value={`Category: ${c.id}`}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <FiChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C97B2]"
                  size={14}
                />
              </div>

              <div className="relative w-[140px]">
                <select
                  value={brandFilter}
                  onChange={(e) => {
                    setBrandFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-3 pr-8 text-xs text-[#3A4668] outline-none transition-all focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/15"
                >
                  <option>Brand: All</option>
                  {brands.map((b) => (
                    <option key={b.id} value={`Brand: ${b.id}`}>
                      {b.title}
                    </option>
                  ))}
                </select>
                <FiChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C97B2]"
                  size={14}
                />
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className={`h-11 rounded-xl px-3 text-xs font-semibold transition-all ${
                  hasActiveFilters
                    ? "bg-[#EAF1FF] text-[#1E3A8A] hover:bg-[#DBEAFE]"
                    : "text-[#8C97B2] hover:text-[#1E3A8A]"
                }`}
              >
                <FiFilter size={14} className="mr-1.5 inline" />
                Clear
              </button>

              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1E3A8A]/15 bg-[#F5F8FF] px-3 text-xs font-semibold text-[#4A5778] transition hover:border-[#1E3A8A]/30 hover:bg-[#EAF1FF] hover:text-[#1E3A8A] lg:hidden"
              >
                <FiFilter size={14} />
                Filters
                {hasActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1E3A8A] text-[10px] font-bold text-white">
                    !
                  </span>
                )}
              </button>
            </div>
          </div>

          {showMobileFilters && (
            <div className="relative z-10 mt-4 space-y-3 border-t border-[#1E3A8A]/10 pt-4 lg:hidden">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-4 pr-10 text-sm text-[#3A4668] outline-none focus:border-[#1E3A8A]"
                >
                  <option>Status: All</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8C97B2]" size={16} />
              </div>
              <div className="relative">
                <select
                  value={orderTypeFilter}
                  onChange={(e) => {
                    setOrderTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-4 pr-10 text-sm text-[#3A4668] outline-none focus:border-[#1E3A8A]"
                >
                  <option>Order Type: All</option>
                  <option value="Order Type: retail">Customer</option>
                  <option value="Order Type: distributor">Distributor</option>
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8C97B2]" size={16} />
              </div>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-4 pr-10 text-sm text-[#3A4668] outline-none focus:border-[#1E3A8A]"
                >
                  <option>Category: All</option>
                  {categories.map((c) => (
                    <option key={c.id} value={`Category: ${c.id}`}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8C97B2]" size={16} />
              </div>
              <div className="relative">
                <select
                  value={brandFilter}
                  onChange={(e) => {
                    setBrandFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-[#D8E2F0] bg-[#F5F8FF] px-4 pr-10 text-sm text-[#3A4668] outline-none focus:border-[#1E3A8A]"
                >
                  <option>Brand: All</option>
                  {brands.map((b) => (
                    <option key={b.id} value={`Brand: ${b.id}`}>
                      {b.title}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8C97B2]" size={16} />
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 w-full rounded-xl bg-[#EAF1FF] text-sm font-semibold text-[#1E3A8A] transition hover:bg-[#DBEAFE]"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* ORDER TABLE */}
        <div className="overflow-hidden rounded-2xl border border-[#E3E9F5] bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1E3A8A]" />

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1180px] border-collapse">
              <thead>
                <tr className="bg-[#1E3A8A]">
                  <th className="w-[45px] px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    {isItemWiseView ? <span className="opacity-50">—</span> : <FiChevronDown size={16} className="mx-auto opacity-50" />}
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    {isItemWiseView ? "Item Reference" : "Order ID"}
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    {isItemWiseView ? "Product" : "Date"}
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    {isItemWiseView ? "SKU" : "Buyer"}
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    {isItemWiseView ? "Qty" : "Total"}
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    {isItemWiseView ? "Price" : ""}
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    {isItemWiseView ? "Total" : ""}
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    {isItemWiseView ? "Tracking No." : "Status"}
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    {isItemWiseView ? "Status" : "Actions"}
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    {isItemWiseView ? "Action" : ""}
                  </th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#EAF1FF]">
                    {isItemWiseView ? "Invoice" : ""}
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleOrders.length > 0 ? (
                  visibleOrders.map((order, index) => {
                    if (isItemWiseView) {
                      const item = order.items && order.items[0];
                      if (!item) return null;
                      const itemStatusBadge = getStatusBadge(item.delivery_status || item.status || "pending");

                      const isDispatchable = canItemDispatch(item) && canDispatch;
                      const isShipable = canItemShip(item) && canShip;
                      const isDeliverable = canItemDeliver(item) && canDeliver;
                      const isUndeliverable = canItemMarkUndelivered(item) && canMarkUndelivered;
                      const isDelivered = isFullyDelivered(item);
                      const isMarking = markingUndelivered.has(`${order.id}-${item.id}`);

                      return (
                        <tr
                          key={`${order.id}-${item.id}-${index}`}
                          className="border-b border-[#1E3A8A]/10 bg-white transition hover:bg-[#FAFBFF]"
                        >
                          <td className="px-4 py-4 text-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1E3A8A]">
                              <FiPackage size={14} />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-lg bg-[#EAF1FF] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#1E3A8A]">
                              {item.itemReferenceId || "N/A"}
                            </span>
                            <p className="mt-1 text-[11px] text-[#8C97B2]">{order.id}</p>
                            <p className="mt-0.5 text-[11px] font-semibold text-[#4A5778]">{order.customer}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.productName}
                                  className="h-9 w-9 rounded-lg border border-[#1E3A8A]/10 object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1E3A8A] flex-shrink-0">
                                  <FiPackage size={14} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-[#0F1B3D]">{item.productName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-lg bg-[#F5F8FF] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#3A4668]">
                              {item.sku}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-[#3A4668]">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-[#4A5778]">
                            {item.price}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-[#1E3A8A]">
                            {item.total}
                          </td>
                          <td className="px-6 py-4">
                            {item.courier_tracking_number ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EAF1FF] px-2.5 py-1 text-[11px] font-bold text-[#1E3A8A]">
                                <FiTruck size={11} />
                                {item.courier_tracking_number}
                              </span>
                            ) : (
                              <span className="text-xs text-[#8C97B2]">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${itemStatusBadge}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {formatStatus(item.delivery_status || item.status || "pending")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleViewOrder(order.id)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/20 bg-[#F5F8FF] text-[#1E3A8A] transition-all hover:border-transparent hover:bg-[#1E3A8A] hover:text-white hover:shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                                title="View Order"
                              >
                                <FiEye size={16} />
                              </button>

                              {isDispatchable && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsFullOrderDispatch(false);
                                    setSelectedOrderForDispatch(order);
                                    setSelectedItemsForDispatch([item]);
                                    setShowDispatchPopup(true);
                                  }}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/20 bg-[#F5F8FF] text-[#1E3A8A] transition-all hover:border-transparent hover:bg-[#1E3A8A] hover:text-white"
                                  title="Dispatch Item"
                                >
                                  <FiTruck size={16} />
                                </button>
                              )}

                              {isShipable && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsFullOrderShip(false);
                                    setSelectedOrderForShip(order);
                                    setSelectedItemsForShip([item]);
                                    setShowShipPopup(true);
                                  }}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/20 bg-[#F5F8FF] text-[#1E3A8A] transition-all hover:border-transparent hover:bg-[#1E3A8A] hover:text-white"
                                  title="Ship Item"
                                >
                                  <FiSend size={16} />
                                </button>
                              )}

                              {isDeliverable && !isDelivered && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsFullOrderDeliver(false);
                                    setSelectedOrderForDeliver(order);
                                    setSelectedItemsForDeliver([item]);
                                    setShowDeliverPopup(true);
                                  }}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2563EB]/30 bg-[#EAF1FF] text-[#1E3A8A] transition-all hover:border-transparent hover:bg-[#1E3A8A] hover:text-white"
                                  title="Deliver Item"
                                >
                                  <FiCheckCircle size={16} />
                                </button>
                              )}

                              {isUndeliverable && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkUndelivered(order, item)}
                                  disabled={isMarking}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C23B32]/20 bg-[#FBEAEA] text-[#C23B32] transition-all hover:border-transparent hover:bg-[#C23B32] hover:text-white disabled:opacity-60"
                                  title="Mark as Undelivered"
                                >
                                  {isMarking ? (
                                    <FiLoader size={16} className="animate-spin" />
                                  ) : (
                                    <FiAlertCircle size={16} />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isDelivered && order.orderId && canViewInvoice && (
                              <button
                                type="button"
                                onClick={() => handleOpenInvoicePdf(order.orderId!, item.lineId || parseInt(item.id))}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#EAF1FF] px-3 py-1.5 text-[11px] font-bold text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white"
                              >
                                <FiFileText size={13} />
                                Invoice
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <React.Fragment key={order.id}>
                        <tr
                          onClick={() => toggleRow(order.id)}
                          className={`group cursor-pointer border-b border-[#1E3A8A]/10 transition-colors ${
                            selectedOrderId === order.id ? "bg-[#EAF1FF]" : "bg-white hover:bg-[#FAFBFF]"
                          }`}
                        >
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(order.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F8FF] text-[#1E3A8A] transition hover:bg-[#EAF1FF]"
                            >
                              {expandedRows.has(order.id) ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-lg bg-[#F5F8FF] px-3 py-1.5 text-xs font-bold tracking-wide text-[#3A4668]">
                              {order.id}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-[#4A5778]">{order.date}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-[#0F1B3D]">{order.customer}</p>
                            <p className="mt-0.5 text-xs text-[#8C97B2]">{formatOrderType(order.orderType)}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-[#1E3A8A]">{order.total}</span>
                          </td>
                          <td className="px-6 py-4 text-right"></td>
                          <td className="px-6 py-4 text-right"></td>
                          <td className="px-6 py-4 text-left">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusBadge(order.orderStatus)}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {formatStatus(order.orderStatus)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewOrder(order.id);
                                }}
                                className="group/view relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/20 bg-[#F5F8FF] text-[#1E3A8A] transition-all hover:border-transparent hover:bg-[#1E3A8A] hover:text-white hover:shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                                title="View Order"
                              >
                                <FiEye size={16} />
                              </button>
                              {hasDispatchableItems(order) && canDispatch && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDispatchFullOrder(order);
                                  }}
                                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/20 bg-[#F5F8FF] text-[#1E3A8A] transition-all hover:border-transparent hover:bg-[#1E3A8A] hover:text-white hover:shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                                  title="Dispatch Order"
                                >
                                  <FiTruck size={16} />
                                </button>
                              )}
                              {hasShipableItems(order) && canShip && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShipFullOrder(order);
                                  }}
                                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/20 bg-[#F5F8FF] text-[#1E3A8A] transition-all hover:border-transparent hover:bg-[#1E3A8A] hover:text-white hover:shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                                  title="Ship Order"
                                >
                                  <FiSend size={16} />
                                </button>
                              )}
                              {hasDeliverableItems(order) && canDeliver && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeliverFullOrder(order);
                                  }}
                                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/20 bg-[#F5F8FF] text-[#1E3A8A] transition-all hover:border-transparent hover:bg-[#1E3A8A] hover:text-white hover:shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                                  title="Deliver Order"
                                >
                                  <FiCheckCircle size={16} />
                                </button>
                              )}
                              {order.orderStatus === "delivered" && order.orderId && canViewInvoice && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenInvoicePdf(order.orderId!);
                                  }}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E3A8A]/20 bg-[#F5F8FF] text-[#1E3A8A] transition-all hover:border-transparent hover:bg-[#1E3A8A] hover:text-white hover:shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                                  title="View Invoice PDF"
                                >
                                  <FiFileText size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center"></td>
                        </tr>

                        {expandedRows.has(order.id) && (
                          <tr>
                            <td colSpan={10} className="bg-[#F5F8FF] px-6 py-0">
                              <div className="overflow-hidden">
                                <div className="animate-slideDown py-5">
                                  <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1E3A8A]">
                                          <FiPackage size={16} />
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-bold text-[#0F1B3D]">Order Items</h4>
                                          <p className="text-xs text-[#8C97B2]">
                                            {order.items?.length || 0} items in this order
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2">
                                        {hasDispatchableItems(order) && canDispatch && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDispatchFromSelection(order);
                                            }}
                                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-4 py-2 text-xs font-bold text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)] transition hover:-translate-y-0.5"
                                          >
                                            <FiTruck size={14} />
                                            {getSelectedDispatchableCount(order) > 0
                                              ? `Dispatch ${getSelectedDispatchableCount(order)}`
                                              : allItemsDispatchable(order)
                                                ? "Dispatch All"
                                                : `Dispatch ${getDispatchableItemsCount(order)}`}
                                          </button>
                                        )}
                                        {hasShipableItems(order) && canShip && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleShipFullOrder(order);
                                            }}
                                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-4 py-2 text-xs font-bold text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)] transition hover:-translate-y-0.5"
                                          >
                                            <FiSend size={14} />
                                            {allItemsShipable(order) ? "Ship All" : `Ship ${getShipableItemsCount(order)}`}
                                          </button>
                                        )}
                                        {hasDeliverableItems(order) && canDeliver && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeliverFullOrder(order);
                                            }}
                                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-4 py-2 text-xs font-bold text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)] transition hover:-translate-y-0.5"
                                          >
                                            <FiCheckCircle size={14} />
                                            {allItemsDeliverable(order) ? "Deliver All" : `Deliver ${getDeliverableItemsCount(order)}`}
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleAllItems(order.id, order.items || []);
                                          }}
                                          className="text-xs font-bold text-[#1E3A8A]"
                                        >
                                          {allSelectableSelected(order.id, order.items || []) ? "Deselect All" : "Select All"}
                                        </button>
                                      </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-2xl border border-[#1E3A8A]/15 bg-white">
                                      <table className="w-full min-w-[1350px] border-collapse">
                                        <thead>
                                          <tr className="border-b border-[#1E3A8A]/10 bg-[#FAFBFF]">
                                            <th className="w-[45px] px-4 py-3 text-center">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleAllItems(order.id, order.items || []);
                                                }}
                                                className="text-[#1E3A8A] hover:text-[#2563EB]"
                                              >
                                                {allSelectableSelected(order.id, order.items || []) ? <FiCheck size={16} /> : <FiSquare size={16} />}
                                              </button>
                                            </th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#8C97B2]">Item Reference</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#8C97B2]">Product</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#8C97B2]">SKU</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#8C97B2]">Qty</th>
                                            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#8C97B2]">Price</th>
                                            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#8C97B2]">Total</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#8C97B2]">Tracking No.</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#8C97B2]">Status</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#8C97B2]">Action</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#8C97B2]">Invoice</th>
                                            {canToggleCancelReturn && (
                                              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#8C97B2]">Cancel/Return</th>
                                            )}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(order.items || []).map((item) => {
                                            const isSelected = selectedItemsMap.get(`${order.id}-${item.id}`);
                                            const isDispatchable = canItemDispatch(item) && canDispatch;
                                            const isShipable = canItemShip(item) && canShip;
                                            const isDeliverable = canItemDeliver(item) && canDeliver;
                                            const isUndeliverable = canItemMarkUndelivered(item) && canMarkUndelivered;
                                            const isDelivered = isFullyDelivered(item);
                                            const isSelectable = isItemSelectable(item) && (canDispatch || canShip || canDeliver);
                                            const toggleKey = `${order.id}-${item.id}`;
                                            const isToggling = togglingCancelReturn.has(toggleKey);
                                            const isCancelReturnAllowed = Boolean(item.is_cancel_return_allowed);
                                            const isMarking = markingUndelivered.has(toggleKey);

                                            return (
                                              <tr
                                                key={item.id}
                                                className={`border-b border-[#1E3A8A]/10 last:border-0 ${
                                                  isSelected ? "bg-[#EAF1FF]" : "hover:bg-[#FAFBFF]"
                                                } ${!isSelectable ? "opacity-60" : ""}`}
                                              >
                                                <td className="px-4 py-3 text-center">
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (isSelectable) toggleItemSelection(order.id, item.id);
                                                    }}
                                                    className={`text-[#1E3A8A] hover:text-[#2563EB] ${
                                                      !isSelectable ? "cursor-not-allowed opacity-40" : ""
                                                    }`}
                                                    disabled={!isSelectable}
                                                  >
                                                    {isSelected ? <FiCheck size={17} /> : <FiSquare size={17} />}
                                                  </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <span className="inline-flex rounded-lg bg-[#EAF1FF] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#1E3A8A]">
                                                    {item.itemReferenceId || "N/A"}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <div className="flex items-center gap-3">
                                                    {item.image ? (
                                                      <img src={item.image} alt={item.productName} className="h-8 w-8 rounded-lg border border-[#1E3A8A]/10 object-cover flex-shrink-0" />
                                                    ) : (
                                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1E3A8A] flex-shrink-0">
                                                        <FiPackage size={12} />
                                                      </div>
                                                    )}
                                                    <span className="text-sm font-medium text-[#3A4668]">{item.productName}</span>
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <span className="text-xs text-[#8C97B2]">{item.sku}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-[#3A4668]">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right text-sm text-[#4A5778]">{item.price}</td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-[#0F1B3D]">{item.total}</td>
                                                <td className="px-4 py-3">
                                                  {item.courier_tracking_number ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EAF1FF] px-2.5 py-1 text-[11px] font-bold text-[#1E3A8A]">
                                                      <FiTruck size={11} />
                                                      {item.courier_tracking_number}
                                                    </span>
                                                  ) : (
                                                    <span className="text-xs text-[#8C97B2]">—</span>
                                                  )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusBadge(item.status)}`}>
                                                    {formatStatus(item.status)}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                  <div className="flex items-center justify-center gap-1 flex-wrap">
                                                    {isDispatchable && (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setIsFullOrderDispatch(false);
                                                          setSelectedOrderForDispatch(order);
                                                          setSelectedItemsForDispatch([item]);
                                                          setShowDispatchPopup(true);
                                                        }}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white"
                                                        title="Dispatch this item"
                                                      >
                                                        <FiTruck size={13} />
                                                      </button>
                                                    )}
                                                    {isShipable && (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setIsFullOrderShip(false);
                                                          setSelectedOrderForShip(order);
                                                          setSelectedItemsForShip([item]);
                                                          setShowShipPopup(true);
                                                        }}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white"
                                                        title="Ship this item"
                                                      >
                                                        <FiSend size={13} />
                                                      </button>
                                                    )}
                                                    {isDeliverable && !isDelivered && (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setIsFullOrderDeliver(false);
                                                          setSelectedOrderForDeliver(order);
                                                          setSelectedItemsForDeliver([item]);
                                                          setShowDeliverPopup(true);
                                                        }}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white"
                                                        title="Deliver this item"
                                                      >
                                                        <FiCheckCircle size={13} />
                                                      </button>
                                                    )}
                                                    {isUndeliverable && (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          if (!isMarking) handleMarkUndelivered(order, item);
                                                        }}
                                                        disabled={isMarking}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FBEAEA] text-[#C23B32] transition hover:bg-[#C23B32] hover:text-white disabled:opacity-60"
                                                        title="Mark as Undelivered"
                                                      >
                                                        {isMarking ? (
                                                          <FiLoader size={12} className="animate-spin" />
                                                        ) : (
                                                          <FiAlertCircle size={12} />
                                                        )}
                                                      </button>
                                                    )}
                                                    {isDelivered && (
                                                      <span className="text-[10px] font-bold text-[#1E3A8A]">✓</span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                  {isDelivered && order.orderId && canViewInvoice && (
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenInvoicePdf(order.orderId!, item.lineId || parseInt(item.id));
                                                      }}
                                                      className="inline-flex items-center gap-1 rounded-lg bg-[#EAF1FF] px-2.5 py-1 text-[10px] font-bold text-[#1E3A8A] transition hover:bg-[#1E3A8A] hover:text-white"
                                                    >
                                                      <FiFileText size={11} />
                                                      Invoice
                                                    </button>
                                                  )}
                                                </td>
                                                {canToggleCancelReturn && (
                                                  <td className="px-4 py-3 text-center">
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isToggling) handleToggleCancelReturn(order, item);
                                                      }}
                                                      disabled={isToggling}
                                                      title={isCancelReturnAllowed ? "Deactivate cancel/return" : "Activate cancel/return"}
                                                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                                                        isCancelReturnAllowed
                                                          ? "bg-[#1E3A8A] text-white hover:bg-[#172554]"
                                                          : "bg-[#EAF1FF] text-[#1E3A8A] hover:bg-[#DBEAFE]"
                                                      }`}
                                                    >
                                                      {isToggling ? (
                                                        <FiLoader size={12} className="animate-spin" />
                                                      ) : isCancelReturnAllowed ? (
                                                        <FiCheckCircle size={12} />
                                                      ) : (
                                                        <FiAlertCircle size={12} />
                                                      )}
                                                      {isToggling ? "Saving..." : isCancelReturnAllowed ? "Allowed" : "Not Allowed"}
                                                    </button>
                                                  </td>
                                                )}
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#1E3A8A]/10 pt-4">
                                      <div className="flex min-w-0 items-center gap-2 text-xs text-[#4A5778]">
                                        <FiMapPin size={14} className="shrink-0 text-[#1E3A8A]" />
                                        <span className="truncate">{order.shippingAddress || "No address"}</span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewOrder(order.id);
                                          }}
                                          className="rounded-xl border border-[#1E3A8A]/20 bg-white px-4 py-2 text-xs font-semibold text-[#1E3A8A] transition hover:border-[#1E3A8A]/30 hover:bg-[#EAF1FF]"
                                        >
                                          <FiEye size={14} className="mr-1.5 inline" />
                                          View Details
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                          <FiSearch size={24} />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#0F1B3D]">No orders found</p>
                        <p className="mt-1 text-xs text-[#8C97B2]">
                          Try adjusting your filters or search criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW */}
          <div className="block lg:hidden">
            {visibleOrders.length > 0 ? (
              visibleOrders.map((order, index) => {
                if (isItemWiseView) {
                  const item = order.items && order.items[0];
                  if (!item) return null;
                  const isDispatchable = canItemDispatch(item) && canDispatch;
                  const isShipable = canItemShip(item) && canShip;
                  const isDeliverable = canItemDeliver(item) && canDeliver;
                  const isUndeliverable = canItemMarkUndelivered(item) && canMarkUndelivered;
                  const isDelivered = isFullyDelivered(item);
                  const isMarking = markingUndelivered.has(`${order.id}-${item.id}`);

                  return (
                    <div
                      key={`${order.id}-${item.id}-${index}`}
                      className="border-b border-[#1E3A8A]/10 bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="inline-flex rounded-lg bg-[#F5F8FF] px-2.5 py-1 text-xs font-bold text-[#3A4668]">
                            {order.id}
                          </span>
                          <p className="mt-2 text-xs text-[#8C97B2]">{order.date}</p>
                          <p className="mt-0.5 text-xs font-semibold text-[#4A5778]">{order.customer}</p>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusBadge(
                            item.delivery_status || item.status || "pending",
                          )}`}
                        >
                          {formatStatus(item.delivery_status || item.status || "pending")}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#1E3A8A]/10 bg-[#FAFBFF] p-3">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="h-10 w-10 rounded-lg border border-[#1E3A8A]/10 object-cover flex-shrink-0" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#1E3A8A] flex-shrink-0">
                            <FiPackage size={14} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#0F1B3D]">{item.productName}</p>
                          <p className="truncate text-[11px] font-bold text-[#2563EB]">Ref: {item.itemReferenceId || "N/A"}</p>
                          <p className="truncate text-[11px] text-[#8C97B2]">SKU: {item.sku} • Qty: {item.quantity}</p>
                        </div>
                        <span className="ml-auto shrink-0 text-sm font-bold text-[#1E3A8A]">{item.total}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewOrder(order.id)}
                          className="flex-1 rounded-lg border border-[#1E3A8A]/20 bg-white px-3 py-2 text-xs font-bold text-[#1E3A8A]"
                        >
                          View Order
                        </button>
                        {isDispatchable && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsFullOrderDispatch(false);
                              setSelectedOrderForDispatch(order);
                              setSelectedItemsForDispatch([item]);
                              setShowDispatchPopup(true);
                            }}
                            className="flex-1 rounded-lg bg-[#1E3A8A] px-3 py-2 text-xs font-bold text-white"
                          >
                            Dispatch
                          </button>
                        )}
                        {isShipable && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsFullOrderShip(false);
                              setSelectedOrderForShip(order);
                              setSelectedItemsForShip([item]);
                              setShowShipPopup(true);
                            }}
                            className="flex-1 rounded-lg bg-[#1E3A8A] px-3 py-2 text-xs font-bold text-white"
                          >
                            Ship
                          </button>
                        )}
                        {isDeliverable && !isDelivered && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsFullOrderDeliver(false);
                              setSelectedOrderForDeliver(order);
                              setSelectedItemsForDeliver([item]);
                              setShowDeliverPopup(true);
                            }}
                            className="flex-1 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-bold text-white"
                          >
                            Delivered
                          </button>
                        )}
                        {isUndeliverable && (
                          <button
                            type="button"
                            onClick={() => handleMarkUndelivered(order, item)}
                            disabled={isMarking}
                            className="flex-1 rounded-lg bg-[#C23B32] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                          >
                            {isMarking ? "Saving..." : "Undelivered"}
                          </button>
                        )}
                        {isDelivered && order.orderId && canViewInvoice && (
                          <button
                            type="button"
                            onClick={() => handleOpenInvoicePdf(order.orderId!, item.lineId || parseInt(item.id))}
                            className="flex-1 rounded-lg bg-[#EAF1FF] px-3 py-2 text-xs font-bold text-[#1E3A8A]"
                          >
                            Invoice PDF
                          </button>
                        )}
                      </div>

                      {canToggleCancelReturn && (
                        <div className="mt-2">
                          <button
                            type="button"
                            disabled={togglingCancelReturn.has(`${order.id}-${item.id}`)}
                            onClick={() => handleToggleCancelReturn(order, item)}
                            className={`w-full rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-60 ${
                              item.is_cancel_return_allowed
                                ? "bg-[#1E3A8A] text-white"
                                : "bg-[#EAF1FF] text-[#1E3A8A]"
                            }`}
                          >
                            {togglingCancelReturn.has(`${order.id}-${item.id}`)
                              ? "Saving..."
                              : item.is_cancel_return_allowed
                                ? "Cancel/Return: Allowed"
                                : "Cancel/Return: Not Allowed"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={order.id}
                    onClick={() => toggleRow(order.id)}
                    className={`cursor-pointer border-b border-[#1E3A8A]/10 p-5 transition-colors ${
                      selectedOrderId === order.id ? "bg-[#EAF1FF]" : "bg-white hover:bg-[#FAFBFF]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-lg bg-[#F5F8FF] px-2.5 py-1 text-xs font-bold text-[#3A4668]">
                          {order.id}
                        </span>
                        <p className="mt-2 text-xs text-[#8C97B2]">{order.date}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrder(order.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F8FF] text-[#1E3A8A]"
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(order.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F8FF] text-[#4A5778]"
                        >
                          {expandedRows.has(order.id) ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-bold text-[#0F1B3D]">{order.customer}</p>
                      <p className="mt-0.5 text-xs text-[#8C97B2]">{formatOrderType(order.orderType)}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-base font-bold text-[#1E3A8A]">{order.total}</span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusBadge(order.orderStatus)}`}>
                        {formatStatus(order.orderStatus)}
                      </span>
                    </div>

                    {expandedRows.has(order.id) && (
                      <div className="mt-4 animate-slideDown border-t border-[#1E3A8A]/10 pt-4">
                        <div className="space-y-2">
                          {(order.items || []).map((item) => {
                            const isDispatchable = canItemDispatch(item) && canDispatch;
                            const isShipable = canItemShip(item) && canShip;
                            const isDeliverable = canItemDeliver(item) && canDeliver;
                            const isUndeliverable = canItemMarkUndelivered(item) && canMarkUndelivered;
                            const isDelivered = isFullyDelivered(item);
                            const isMarking = markingUndelivered.has(`${order.id}-${item.id}`);

                            return (
                              <div
                                key={item.id}
                                className="rounded-xl border border-[#1E3A8A]/10 bg-[#FAFBFF] p-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {item.image && (
                                      <img src={item.image} alt={item.productName} className="h-8 w-8 rounded-lg border border-[#1E3A8A]/10 object-cover flex-shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-[#0F1B3D]">{item.productName}</p>
                                      <p className="mt-0.5 truncate text-[11px] font-bold text-[#2563EB]">Ref: {item.itemReferenceId || "N/A"}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  {isDispatchable && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsFullOrderDispatch(false);
                                        setSelectedOrderForDispatch(order);
                                        setSelectedItemsForDispatch([item]);
                                        setShowDispatchPopup(true);
                                      }}
                                      className="flex-1 rounded-lg bg-[#1E3A8A] px-3 py-2 text-xs font-bold text-white"
                                    >
                                      Dispatch
                                    </button>
                                  )}
                                  {isShipable && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsFullOrderShip(false);
                                        setSelectedOrderForShip(order);
                                        setSelectedItemsForShip([item]);
                                        setShowShipPopup(true);
                                      }}
                                      className="flex-1 rounded-lg bg-[#1E3A8A] px-3 py-2 text-xs font-bold text-white"
                                    >
                                      Ship
                                    </button>
                                  )}
                                  {isDeliverable && !isDelivered && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsFullOrderDeliver(false);
                                        setSelectedOrderForDeliver(order);
                                        setSelectedItemsForDeliver([item]);
                                        setShowDeliverPopup(true);
                                      }}
                                      className="flex-1 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-bold text-white"
                                    >
                                      Delivered
                                    </button>
                                  )}
                                  {isUndeliverable && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkUndelivered(order, item);
                                      }}
                                      disabled={isMarking}
                                      className="flex-1 rounded-lg bg-[#C23B32] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                                    >
                                      {isMarking ? "Saving..." : "Undelivered"}
                                    </button>
                                  )}
                                  {isDelivered && order.orderId && canViewInvoice && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenInvoicePdf(order.orderId!, item.lineId || parseInt(item.id));
                                      }}
                                      className="flex-1 rounded-lg bg-[#EAF1FF] px-3 py-2 text-xs font-bold text-[#1E3A8A]"
                                    >
                                      Invoice PDF
                                    </button>
                                  )}
                                </div>

                                {canToggleCancelReturn && (
                                  <div className="mt-2">
                                    <button
                                      type="button"
                                      disabled={togglingCancelReturn.has(`${order.id}-${item.id}`)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleCancelReturn(order, item);
                                      }}
                                      className={`w-full rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-60 ${
                                        item.is_cancel_return_allowed
                                          ? "bg-[#1E3A8A] text-white"
                                          : "bg-[#EAF1FF] text-[#1E3A8A]"
                                      }`}
                                    >
                                      {togglingCancelReturn.has(`${order.id}-${item.id}`)
                                        ? "Saving..."
                                        : item.is_cancel_return_allowed
                                          ? "Cancel/Return: Allowed"
                                          : "Cancel/Return: Not Allowed"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#1E3A8A]">
                  <FiSearch size={24} />
                </div>
                <p className="mt-4 text-sm font-bold text-[#0F1B3D]">No orders found</p>
                <p className="mt-1 text-xs text-[#8C97B2]">Try adjusting your filters.</p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredOrders.length > 0 && (
            <div className="border-t border-[#1E3A8A]/10 bg-[#FAFBFF] px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#8C97B2]">
                  Showing{" "}
                  <span className="font-bold text-[#3A4668]">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-[#3A4668]">
                    {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-[#3A4668]">{filteredOrders.length}</span> entries
                </p>

                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E3A8A]/15 bg-white text-[#1E3A8A] transition hover:border-[#1E3A8A]/30 hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronLeft size={17} />
                  </button>
                  {[...Array(Math.min(totalPages, 3))].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => changePage(page)}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${
                          currentPage === page
                            ? "bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-white shadow-[0_6px_14px_-6px_rgba(30,58,138,0.5)]"
                            : "text-[#4A5778] hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {totalPages > 3 && (
                    <>
                      <span className="px-1 text-xs text-[#8C97B2]">...</span>
                      <button
                        type="button"
                        onClick={() => changePage(totalPages)}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${
                          currentPage === totalPages
                            ? "bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] text-white"
                            : "text-[#4A5778] hover:bg-[#F5F8FF] hover:text-[#1E3A8A]"
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1E3A8A]/15 bg-white text-[#1E3A8A] transition hover:border-[#1E3A8A]/30 hover:bg-[#EAF1FF] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* POPUPS */}
      <ViewOrderPopup
        isOpen={showViewPopup}
        onClose={closeViewPopup}
        orderId={selectedOrderForView}
        orderData={selectedOrderDataForView}
        onViewInvoice={handleOpenInvoicePdf}
      />
      <DispatchPopup
        isOpen={showDispatchPopup}
        onClose={closeDispatchPopup}
        order={selectedOrderForDispatch}
        selectedItems={selectedItemsForDispatch}
        onDispatch={handleDispatchSubmit}
        isFullOrder={isFullOrderDispatch}
      />
      <ShipPopup
        isOpen={showShipPopup}
        onClose={closeShipPopup}
        order={selectedOrderForShip}
        selectedItems={selectedItemsForShip}
        onShip={handleShipSubmit}
        isFullOrder={isFullOrderShip}
      />
      <DeliverPopup
        isOpen={showDeliverPopup}
        onClose={closeDeliverPopup}
        order={selectedOrderForDeliver}
        selectedItems={selectedItemsForDeliver}
        onDeliver={handleDeliverSubmit}
        isFullOrder={isFullOrderDeliver}
      />

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); max-height: 0; }
          to { opacity: 1; transform: translateY(0); max-height: 1000px; }
        }
        .animate-slideDown { animation: slideDown 0.35s ease-out forwards; }
      `}</style>
    </>
  );
};

// =====================================================
// MAIN ORDERS COMPONENT
// =====================================================

const Orders: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filteredForExport, setFilteredForExport] = useState<Order[]>([]);
  const [filterLabel, setFilterLabel] = useState<string>("All Orders");

  // ===================================================
  // ✅ PERMISSIONS
  // ===================================================

  const {
    hasPermission,
    hasModuleAccess,
    isSuperAdmin,
    loading: permissionsLoading,
  } = usePermissions();

  const canViewOrders = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("order") ||
      hasPermission("order.view"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  const canExport = useMemo(
    () =>
      isSuperAdmin ||
      hasModuleAccess("order") ||
      hasPermission("order.details"),
    [isSuperAdmin, hasModuleAccess, hasPermission],
  );

  useEffect(() => {
    if (!permissionsLoading) {
      fetchOrders();
    }
  }, [permissionsLoading]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getOrders();
      if (response.data.success) {
        const data = response.data.data || [];
        const extractedOrders = data.map((item: any) => item.order);
        setOrdersData(extractedOrders);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const convertToOrder = (apiOrder: any, index: number): Order => {
    return {
      id: apiOrder.order_reference,
      orderId: apiOrder.id,
      orderReference: apiOrder.order_reference,
      date: apiOrder.order_date
        ? new Date(apiOrder.order_date).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "N/A",
      customer: apiOrder.user?.name || "N/A",
      customerName: apiOrder.user?.name || "N/A",
      total: `₹${Number(apiOrder.total_payable || 0).toLocaleString("en-IN")}`,
      totalPayable: Number(apiOrder.total_payable || 0),
      paymentStatus: apiOrder.payment_status || "N/A",
      orderStatus: apiOrder.order_status || "N/A",
      orderType: apiOrder.order_type || "retail",
      amountPaid: apiOrder.amount_paid || 0,
      subtotal: apiOrder.subtotal || 0,
      totalGst: apiOrder.total_gst || 0,
      shippingCharge: apiOrder.shipping_charge || 0,
      userId: apiOrder.user?.id || 0,
      userEmail: apiOrder.user?.email || "N/A",
      userPhone: apiOrder.user?.phone || "N/A",
      shippingAddress: apiOrder.shipping_address?.full_address || "N/A",
      shippingAddressFull: apiOrder.shipping_address?.full_address || "N/A",
      trackingNumber: apiOrder.gateway_transaction_id || "N/A",
      paymentGateway: apiOrder.payment_gateway || undefined,
      gatewayTransactionId: apiOrder.gateway_transaction_id || undefined,
      courierCompany: apiOrder.courier_company || undefined,
      courierTrackingNumber: apiOrder.courier_tracking_number || undefined,
      courierDeliveryDate: apiOrder.courier_delivery_date || undefined,
      shippingDetails: apiOrder.shipping_details || undefined,
      items:
        apiOrder.items?.map((item: any) => ({
          id: String(item.line_id || item.id || ""),
          lineId: item.line_id || item.id,
          orderReference: item.order_reference || apiOrder.order_reference || "N/A",
          itemReferenceId: item.item_reference_id || "N/A",
          productName: item.product_name || "N/A",
          sku: item.product_code || "N/A",
          quantity: item.quantity,
          price: `₹${Number(item.unit_price || 0).toLocaleString("en-IN")}`,
          total: `₹${Number(item.line_total || 0).toLocaleString("en-IN")}`,
          unitPrice: item.unit_price || 0,
          lineTotal: item.line_total || 0,
          status:
            item.delivery_status?.charAt(0).toUpperCase() +
              item.delivery_status?.slice(1) || "Pending",
          delivery_status: item.delivery_status || "pending",
          image: item.primary_image || item.product_image || undefined,
          productId: item.product_id,
          isReturnable: item.is_returnable,
          availableForReturn: item.available_for_return,
          gstRate: item.gst_rate,
          gstAmount: item.gst_amount,
          is_cancel_return_allowed: Boolean(item.is_cancel_return_allowed),
          courier_tracking_number: item.courier_tracking_number || undefined,
          courierTrackingNumber: item.courier_tracking_number || undefined,
        })) || [],
    };
  };

  const uiOrders = useMemo(() => {
    return ordersData.map((order, index) => convertToOrder(order, index));
  }, [ordersData]);

  const totalEarnings = useMemo(() => {
    return ordersData.reduce((sum, order) => sum + (order.total_payable || 0), 0);
  }, [ordersData]);

  const statsData = useMemo(() => {
    const total = uiOrders.length;
    const confirmed = uiOrders.filter(
      (o) => o.orderStatus === "confirmed" || o.orderStatus === "processing",
    ).length;
    const delivered = uiOrders.filter(
      (o) => o.orderStatus === "delivered" || o.orderStatus === "partial_delivered",
    ).length;

    return [
      {
        title: "Total Orders",
        value: total,
        icon: (
          <span className="text-[#1E3A8A]">
            <ClipboardIcon />
          </span>
        ),
        barColor: "bg-[#1E3A8A]",
        textColor: "text-[#1E3A8A]",
        valueColor: "text-[#172554]",
      },
      {
        title: "Total Earnings",
        value: `₹${totalEarnings.toLocaleString("en-IN")}`,
        icon: (
          <span className="text-[#2563EB]">
            <DollarIcon />
          </span>
        ),
        barColor: "bg-[#2563EB]",
        textColor: "text-[#2563EB]",
        valueColor: "text-[#1E3A8A]",
      },
      {
        title: "Confirmed Orders",
        value: confirmed,
        icon: (
          <span className="text-[#1E3A8A]">
            <CreditCardIcon />
          </span>
        ),
        barColor: "bg-[#1E3A8A]",
        textColor: "text-[#1E3A8A]",
        valueColor: "text-[#172554]",
      },
      {
        title: "Delivered Orders",
        value: delivered,
        icon: (
          <span className="text-[#172554]">
            <CheckCircleIcon />
          </span>
        ),
        barColor: "bg-[#172554]",
        textColor: "text-[#172554]",
        valueColor: "text-[#172554]",
      },
    ];
  }, [uiOrders, totalEarnings]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleDownloadFilteredCsv = () => {
    if (!filteredForExport || filteredForExport.length === 0) {
      toast.error("No orders match the current filters to export.");
      return;
    }
    const slug = filterLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    downloadOrdersCsv(filteredForExport, `orders-${slug || "filtered"}`);
  };

  // ===================================================
  // ✅ LOADING STATE
  // ===================================================

  if (permissionsLoading) {
    return <PermissionLoadingState />;
  }

  // ===================================================
  // ✅ ACCESS DENIED
  // ===================================================

  if (!canViewOrders && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] p-4 font-poppins">
        <div className="max-w-md rounded-2xl border border-[#E3E9F5] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBEAEA] text-[#C23B32]">
            <FiAlertCircle size={26} />
          </div>
          <h2 className="text-lg font-bold text-[#0F1B3D]">Access Denied</h2>
          <p className="mt-2 text-sm text-[#6B7896]">
            You don't have permission to access this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8FF] p-4 font-poppins">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#1E3A8A]" />
            <div className="h-2 w-2 rounded-full bg-[#FACC15]" />
            <div className="h-2 w-2 rounded-full bg-[#2563EB]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2563EB]">
              Order Management
            </span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#0F1B3D] sm:text-[30px]">Orders</h1>
          <p className="mt-1 text-sm text-[#4A5778]">
            Manage orders, dispatch, shipping, and delivery from one place.
          </p>
        </div>

        {canExport && (
          <button
            type="button"
            onClick={handleDownloadFilteredCsv}
            disabled={filteredForExport.length === 0 || loading}
            title={`Export ${filterLabel} as CSV`}
            className="flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#1E3A8A]/20 bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] px-5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(30,58,138,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-8px_rgba(30,58,138,0.6)] disabled:cursor-not-allowed disabled:opacity-60 md:self-auto"
          >
            <FiDownload size={15} />
            Download CSV
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
              {filterLabel}
            </span>
            {filteredForExport.length > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                {filteredForExport.length}
              </span>
            )}
          </button>
        )}
      </div>

      {loading ? (
        <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-[135px] animate-pulse rounded-2xl border border-[#1E3A8A]/10 bg-white"
            />
          ))}
        </div>
      ) : (
        <div className="mb-5">
          <StatsCard stats={statsData} />
        </div>
      )}

      <div className="min-w-0">
        <OrdersTable
          onSelectOrder={handleSelectOrder}
          selectedOrderId={selectedOrder?.id}
          onFilteredChange={(list, label) => {
            setFilteredForExport(list);
            setFilterLabel(label);
          }}
        />
      </div>
    </div>
  );
};

export default Orders;