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
  FiExternalLink,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

import {
  orderApi,
} from "../../api/endpoints/orders";

import orderInvoiceApi, {
  Invoice,
  Order as InvoiceOrder,
} from "../../api/endpoints/orderInvoice";

import GlobalModal from "@/components/common/GlobalModal";
import StatsCard from "@/components/common/StatsCard";


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

const DollarIcon = () => (
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
      d="M8 8H16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M8 12H16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M8 16H16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);


export interface OrderItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  price: string;
  total: string;
  status: string;
  image?: string;
  lineId?: number;
  delivery_status?: string;
  unitPrice?: number;
  lineTotal?: number;
  productId?: number;
  isReturnable?: number;
  availableForReturn?: number;
  gstRate?: number;
  gstAmount?: number;
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
}


// =====================================================
// INVOICE VIEW POPUP - WITH ITEM SUPPORT
// =====================================================

interface InvoiceViewPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  orderItemId?: number | null; // Optional - for highlighting specific item
}

const InvoiceViewPopup: React.FC<InvoiceViewPopupProps> = ({
  isOpen,
  onClose,
  orderId,
  orderItemId = null
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchInvoice(orderId);
    }
  }, [isOpen, orderId]);

  const fetchInvoice = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await orderInvoiceApi.getByOrderId(id);

      if (response.data.success) {
        setInvoiceData(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch invoice data");
        setInvoiceData(null);
      }
    } catch (err) {
      setError("An error occurred while fetching invoice");
      console.error(err);
      setInvoiceData(null);
    } finally {
      setLoading(false);
    }
  };

  // Add helper function to safely format currency
  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '₹0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '₹0';
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Loading state
  if (loading) {
    return (
      <GlobalModal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
          <ModalLoader message="Loading invoice..." />
        </div>
      </GlobalModal>
    );
  }

  // Error state
  if (error || !invoiceData) {
    return (
      <GlobalModal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
          <ModalError error={error || "No invoice data found"} onClose={onClose} />
        </div>
      </GlobalModal>
    );
  }

  // Safe destructuring with fallbacks
  const { invoice = {}, order = {} } = invoiceData || {};

  // Get order items with safe fallback
  const orderItems = (order && order.order_items) || [];

  // If orderItemId is provided, filter to show only that item
  const filteredItems = orderItemId
    ? orderItems.filter((item: any) => item.id === orderItemId)
    : orderItems;

  // Calculate totals for filtered items with safe fallbacks
  const getFilteredTotals = () => {
    if (!invoice) {
      return {
        subtotal: 0,
        totalPayable: 0,
        totalTax: 0,
        couponDiscount: 0,
        shippingCharge: 0,
      };
    }

    if (!orderItemId || filteredItems.length === 0) {
      return {
        subtotal: parseFloat(invoice.subtotal_before_redemption || 0),
        totalPayable: parseFloat(invoice.total_payable || 0),
        totalTax: parseFloat(invoice.total_tax || 0),
        couponDiscount: parseFloat(invoice.coupon_discount || 0),
        shippingCharge: parseFloat(invoice.shipping_charge || 0),
      };
    }

    // Calculate totals for single item
    const item = filteredItems[0];
    const subtotal = parseFloat(item.line_total || 0) - parseFloat(item.gst_amount || 0);
    const totalTax = parseFloat(item.gst_amount || 0);
    const totalPayable = parseFloat(item.line_total || 0);

    // Coupon discount and shipping are pro-rated for single item
    const totalOrderItems = orderItems.length || 1;
    const couponDiscount = totalOrderItems > 0
      ? (parseFloat(invoice.coupon_discount || 0) / totalOrderItems)
      : 0;
    const shippingCharge = totalOrderItems > 0
      ? (parseFloat(invoice.shipping_charge || 0) / totalOrderItems)
      : 0;

    return {
      subtotal,
      totalPayable,
      totalTax,
      couponDiscount,
      shippingCharge,
    };
  };

  const totals = getFilteredTotals();

  return (
    <GlobalModal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[#b8902e]/10 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">
                  Invoice Details
                </span>
              </div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#2a2620]">
                <FiFileText className="text-[#a8841c]" />
                Invoice #{invoice.invoice_number || 'N/A'}
              </h2>
              <p className="mt-1 text-sm text-[#a89a7d]">
                Order: {order.order_reference || 'N/A'} • {order.delivery_state || 'N/A'}
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

        <div className="max-h-[calc(95vh-190px)] overflow-y-auto p-5 sm:p-6">
          {/* Show item-specific badge */}
          {orderItemId && (
            <div className="mb-4 rounded-xl border border-[#b8902e]/20 bg-[#fffaf0] p-3">
              <div className="flex items-center gap-2 text-sm">
                <FiPackage className="text-[#b8902e]" size={16} />
                <span className="font-semibold text-[#2a2620]">Item-Specific Invoice</span>
                
              </div>
            </div>
          )}

          {/* Invoice Header - Seller & Buyer */}
          <div className="mb-6 rounded-2xl border border-[#b8902e]/15 bg-gradient-to-br from-[#fffaf0] to-[#f8f1df] p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Seller</p>
                <p className="mt-1 text-lg font-bold text-[#2a2620]">{(invoice.seller && invoice.seller.name) || "N/A"}</p>
                <p className="mt-0.5 text-sm text-[#786f60]">GSTIN: {(invoice.seller && invoice.seller.gstin) || "N/A"}</p>
                <p className="text-sm text-[#786f60]">{(invoice.seller && invoice.seller.address) || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Buyer</p>
                <p className="mt-1 text-lg font-bold text-[#2a2620]">{(invoice.buyer && invoice.buyer.name) || "N/A"}</p>
                <p className="text-sm text-[#786f60]">{(invoice.buyer && invoice.buyer.address) || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="overflow-hidden rounded-2xl border border-[#b8902e]/15">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="bg-[#2f2a22]">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">#</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Product</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Code</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Qty</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Unit Price</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">GST</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item: any, idx: number) => (
                      <tr
                        key={item.id || idx}
                        className={`border-b border-[#b8902e]/10 transition hover:bg-[#faf8f3] ${orderItemId === item.id ? 'bg-[#fffaf0] border-l-2 border-l-[#b8902e]' : ''
                          }`}
                      >
                        <td className="px-4 py-3 text-sm text-[#8f6d1d]">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.product_image && (
                              <img
                                src={item.product_image}
                                alt={item.product_name || 'Product'}
                                className="h-10 w-10 rounded-xl border border-[#b8902e]/15 object-cover"
                              />
                            )}
                            <div>
                              <p className="text-sm font-semibold text-[#2a2620]">{item.product_name || 'N/A'}</p>
                              {orderItemId === item.id && (
                                <span className="text-[10px] font-bold text-[#b8902e]">✓ Selected Item</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#a89a7d]">{item.product_code || "N/A"}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-[#4a4436]">{item.quantity || 0}</td>
                        <td className="px-4 py-3 text-right text-sm text-[#786f60]">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 text-right text-sm text-[#786f60]">{item.gst_rate || 0}%</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-[#2a2620]">{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#a89a7d]">
                        No items found in this invoice
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a89a7d]">Subtotal</p>
              <p className="mt-1 text-base font-bold text-[#2a2620]">{formatCurrency(totals.subtotal)}</p>
            </div>

            <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a89a7d]">Coupon Discount</p>
              <p className="mt-1 text-base font-bold text-[#2a2620]">{formatCurrency(totals.couponDiscount)}</p>
              {invoice.coupon_code && (
                <p className="text-[10px] text-[#a89a7d]">Code: {invoice.coupon_code}</p>
              )}
            </div>

            <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a89a7d]">Shipping</p>
              <p className="mt-1 text-base font-bold text-[#2a2620]">{formatCurrency(totals.shippingCharge)}</p>
            </div>

            <div className="rounded-xl border border-[#b8902e]/20 bg-gradient-to-br from-[#fffaf0] to-[#f8f1df] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9a741c]">Total Payable</p>
              <p className="mt-1 text-xl font-bold text-[#8f6d1d]">{formatCurrency(totals.totalPayable)}</p>
            </div>
          </div>

          {/* Tax Details */}
          {totals.totalTax > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a89a7d]">Total Tax</p>
                <p className="mt-1 text-base font-bold text-[#2a2620]">{formatCurrency(totals.totalTax)}</p>
              </div>
            </div>
          )}

          {/* Order Reference & Delivery State */}
          <div className="mt-5 rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Order Reference</p>
                <p className="text-sm font-semibold text-[#2a2620]">{order.order_reference || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Invoice Number</p>
                <p className="text-sm font-semibold text-[#2a2620]">{invoice.invoice_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Delivery State</p>
                <p className="text-sm font-semibold text-[#2a2620]">{invoice.delivery_state || "N/A"}</p>
              </div>
             
            </div>
          </div>

          {/* Order Status Badge */}
          {order && order.status && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#b8902e]">
                <FiCheckCircle size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Order Status</p>
                <p className="text-sm font-bold capitalize text-[#8f6d1d]">{order.status || "N/A"}</p>
              </div>
              <div className="ml-auto">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${order.status === "delivered"
                  ? "border-[#b8902e]/25 bg-[#f8f3e5] text-[#8f6d1d]"
                  : "border-[#d4af52]/30 bg-[#fffaf0] text-[#9a741c]"
                  }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {order.status?.toUpperCase() || "N/A"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-between items-center border-t border-[#b8902e]/10 bg-[#fffdfa]/95 px-6 py-4 backdrop-blur-sm">
          {invoice.pdf_path && (
            <button
              type="button"
              onClick={() => {
                const pdfUrl = invoice.pdf_path;
                if (pdfUrl) {
                  window.open(pdfUrl, '_blank');
                }
              }}
              className="flex items-center gap-2 rounded-xl border border-[#b8902e]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#8f6d1d] transition hover:border-[#b8902e] hover:bg-[#faf8f3]"
            >
              <FiFileText size={16} />
              Download PDF
            </button>
          )}
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

// Rest of the code remains the same...

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
  orderId: string | null;
  orderData?: any;
}

const ViewOrderPopup: React.FC<ViewOrderPopupProps> = ({ isOpen, onClose, orderId, orderData }) => {
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
    if (isOpen) {
      setActiveTab("items");
    }
  }, [isOpen, orderId, orderData]);

  const fetchOrderDetails = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await orderApi.getOrderDetails(id);
      let data = null;

      if (response?.data?.data) {
        data = response.data.data;
      } else if (response?.data) {
        data = response.data;
      }

      if (data) {
        setOrderDetails(data);
      } else {
        setError("No data received from API");
      }
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
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />
          <ModalLoader message="Loading order details..." />
        </div>
      </GlobalModal>
    );
  }

  if (error || !orderDetails) {
    return (
      <GlobalModal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />
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

  // Get summary values from the order data
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
    id: String(item.line_id || ''),
    lineId: item.line_id,
    productName: item.product_name || "N/A",
    sku: item.product_code || "N/A",
    quantity: item.quantity || 0,
    price: `₹${(item.unit_price || 0).toLocaleString("en-IN")}`,
    total: `₹${(item.line_total || 0).toLocaleString("en-IN")}`,
    unitPrice: item.unit_price || 0,
    lineTotal: item.line_total || 0,
    status: item.delivery_status ? item.delivery_status.charAt(0).toUpperCase() + item.delivery_status.slice(1) : "Pending",
    delivery_status: item.delivery_status || "pending",
    image: item.primary_image || undefined,
    productId: item.product_id,
    isReturnable: item.is_returnable,
    availableForReturn: item.available_for_return,
    gstRate: item.gst_rate,
    gstAmount: item.gst_amount,
  }));

  const getStatusBadge = (status: string) => {
    const lowerStatus = status?.toLowerCase() || "";
    switch (lowerStatus) {
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
      case "partial_dispatched":
      case "partial_shipped":
        return "border-[#d9a441]/30 bg-[#fff8e8] text-[#a06f13]";
      default:
        return "border-[#d8d1c4] bg-[#f6f4ef] text-[#857b6c]";
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return "N/A";
    return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Get shipping address from either delivery_address or shipping_address
  const getShippingAddress = () => {
    if (delivery_address) return delivery_address;
    if (shipping_address) return shipping_address;
    return null;
  };

  const addr = getShippingAddress();


  return (
    <GlobalModal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}>
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

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
                {order_reference || "N/A"} • {formatDate(order_date)}
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

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("items")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === "items"
                ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/20"
                : "bg-[#faf8f3] text-[#786f60] hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
                }`}
            >
              <FiPackage className="mr-1.5 inline" size={13} />
              Items ({items?.length || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === "details"
                ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/20"
                : "bg-[#faf8f3] text-[#786f60] hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
                }`}
            >
              <FiUser className="mr-1.5 inline" size={13} />
              Customer Details
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tracking")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === "tracking"
                ? "bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] text-white shadow-md shadow-[#b8902e]/20"
                : "bg-[#faf8f3] text-[#786f60] hover:bg-[#b8902e]/10 hover:text-[#8f6d1d]"
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
              <div className="overflow-hidden rounded-2xl border border-[#b8902e]/15">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] border-collapse">
                    <thead>
                      <tr className="bg-[#2f2a22]">
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">#</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Product</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">SKU</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Qty</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Price</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Total</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Status</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Invoice</th>
                      </tr>
                    </thead>

                    <tbody>
                      {uiItems && uiItems.length > 0 ? (
                        uiItems.map((item, idx) => {
                          const isDelivered = item.delivery_status?.toLowerCase() === "delivered";

                          return (
                            <tr key={item.id} className="border-b border-[#b8902e]/10 transition hover:bg-[#faf8f3]">
                              <td className="px-4 py-3 text-sm text-[#8f6d1d]">{idx + 1}</td>

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.productName}
                                      className="h-10 w-10 rounded-xl border border-[#b8902e]/15 object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f3] text-[#b8902e]">
                                      <FiPackage size={15} />
                                    </div>
                                  )}
                                  <span className="text-sm font-semibold text-[#2a2620]">{item.productName}</span>
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                <span className="rounded-lg bg-[#faf8f3] px-2.5 py-1 text-xs font-semibold text-[#786f60]">
                                  {item.sku}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-center text-sm text-[#4a4436]">{item.quantity}</td>

                              <td className="px-4 py-3 text-right text-sm text-[#786f60]">{item.price}</td>

                              <td className="px-4 py-3 text-right text-sm font-bold text-[#2a2620]">{item.total}</td>

                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusBadge(
                                    item.status
                                  )}`}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                  {getStatusText(item.status)}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-center">
                                {isDelivered && orderDetails?.id && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const orderId = orderDetails?.id;
                                      if (orderId) {
                                        handleViewInvoiceFromViewPopup(orderId, item.lineId);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#b8902e]/10 px-3 py-1.5 text-xs font-bold text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
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
                          <td colSpan={8} className="px-4 py-8 text-center text-sm text-[#a89a7d]">
                            No items found in this order
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary */}
              <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3] p-5">
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#d4af52]/20" />

                <div className="mb-4 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />
                  <h4 className="text-sm font-bold text-[#2a2620]">Order Summary</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a89a7d]">Subtotal</p>
                    <p className="mt-1 text-base font-bold text-[#2a2620]">
                      ₹{Number(subtotal || 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a89a7d]">Shipping</p>
                    <p className="mt-1 text-base font-bold text-[#2a2620]">
                      ₹{Number(shippingCharge || 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#a89a7d]">Tax (GST)</p>
                    <p className="mt-1 text-base font-bold text-[#2a2620]">
                      ₹{Number(totalGst || 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#b8902e]/20 bg-gradient-to-br from-[#fffaf0] to-[#f8f1df] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#9a741c]">Total Payable</p>
                    <p className="mt-1 text-xl font-bold text-[#8f6d1d]">
                      ₹{Number(totalPayable || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                      <FiUser size={17} />
                    </div>
                    <h4 className="font-bold text-[#2a2620]">Customer Information</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 border-b border-[#b8902e]/10 pb-2.5">
                      <span className="text-xs text-[#a89a7d]">Name</span>
                      <span className="text-right text-sm font-semibold text-[#2a2620]">{user?.name || "N/A"}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-b border-[#b8902e]/10 pb-2.5">
                      <span className="text-xs text-[#a89a7d]">Email</span>
                      <span className="max-w-[65%] truncate text-right text-sm font-semibold text-[#2a2620]">
                        {user?.email || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-b border-[#b8902e]/10 pb-2.5">
                      <span className="text-xs text-[#a89a7d]">Phone</span>
                      <span className="text-right text-sm font-semibold text-[#2a2620]">{user?.phone || "N/A"}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-b border-[#b8902e]/10 pb-2.5">
                      <span className="text-xs text-[#a89a7d]">Order Type</span>
                      <span className="text-sm font-semibold capitalize text-[#8f6d1d]">
                        {orderDetails?.order_type || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-[#a89a7d]">Payment Status</span>
                      <span className="rounded-full border border-[#b8902e]/20 bg-white px-2.5 py-1 text-xs font-bold capitalize text-[#8f6d1d]">
                        {payment?.payment_status || orderDetails?.payment_status || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                      <FiMapPin size={17} />
                    </div>
                    <h4 className="font-bold text-[#2a2620]">Shipping Address</h4>
                  </div>

                  {addr ? (
                    <>
                      <p className="text-sm leading-6 text-[#6b6152]">
                        {addr.full_address || "No address provided"}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-[#b8902e]/10 bg-white p-3 text-xs">
                        <div>
                          <span className="text-[#a89a7d]">Address Line 1:</span>
                          <span className="ml-1 font-semibold text-[#4a4436]">{addr.address_line_1 || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#a89a7d]">Address Line 2:</span>
                          <span className="ml-1 font-semibold text-[#4a4436]">{addr.address_line_2 || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#a89a7d]">City:</span>
                          <span className="ml-1 font-semibold text-[#4a4436]">{addr.city || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#a89a7d]">State:</span>
                          <span className="ml-1 font-semibold text-[#4a4436]">{addr.state || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#a89a7d]">Country:</span>
                          <span className="ml-1 font-semibold text-[#4a4436]">{addr.country || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[#a89a7d]">Pincode:</span>
                          <span className="ml-1 font-semibold text-[#4a4436]">{addr.postal_code || addr.pincode || "N/A"}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#a89a7d]">No address provided</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                    <FiCalendar size={17} />
                  </div>
                  <h4 className="font-bold text-[#2a2620]">Order Timeline</h4>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#b8902e]" />
                    <span className="text-xs text-[#a89a7d]">Order Placed:</span>
                    <span className="text-sm font-semibold text-[#4a4436]">{formatDate(order_date)}</span>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#8f6d1d]" />
                    <span className="text-xs text-[#a89a7d]">Current Status:</span>
                    <span className="text-sm font-bold capitalize text-[#8f6d1d]">{getStatusText(order_status || "N/A")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tracking" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                    <FiTruck size={17} />
                  </div>
                  <h4 className="font-bold text-[#2a2620]">Tracking Information</h4>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <span className="text-xs text-[#a89a7d]">Order Status</span>
                    <span className="text-sm font-bold capitalize text-[#8f6d1d]">{getStatusText(order_status || "N/A")}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <span className="text-xs text-[#a89a7d]">Payment Gateway</span>
                    <span className="text-sm font-semibold text-[#2a2620]">{payment?.payment_gateway || orderDetails?.payment_gateway || "N/A"}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <span className="text-xs text-[#a89a7d]">Transaction ID</span>
                    <span className="max-w-[65%] truncate text-sm font-semibold text-[#2a2620]">
                      {payment?.gateway_transaction_id || orderDetails?.gateway_transaction_id || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <span className="text-xs text-[#a89a7d]">Amount Paid</span>
                    <span className="text-sm font-bold text-[#8f6d1d]">
                      ₹{Number(payment?.amount_paid || orderDetails?.amount_paid || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Shipping Details - Courier Info */}
                  {(shipping_details || orderDetails?.courier_company) && (
                    <>
                      <div className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-white p-3">
                        <span className="text-xs text-[#a89a7d]">Courier Company</span>
                        <span className="text-sm font-semibold text-[#2a2620]">
                          {shipping_details?.courier_company || orderDetails?.courier_company || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-white p-3">
                        <span className="text-xs text-[#a89a7d]">Tracking Number</span>
                        <span className="text-sm font-semibold text-[#2a2620]">
                          {shipping_details?.courier_tracking_number || orderDetails?.courier_tracking_number || "N/A"}
                        </span>
                      </div>

                      {shipping_details?.courier_delivery_date && (
                        <div className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-white p-3">
                          <span className="text-xs text-[#a89a7d]">Expected Delivery</span>
                          <span className="text-sm font-semibold text-[#2a2620]">
                            {formatDate(shipping_details.courier_delivery_date)}
                          </span>
                        </div>
                      )}

                      {shipping_details?.delivery_notes && (
                        <div className="flex items-center justify-between rounded-xl border border-[#b8902e]/10 bg-white p-3">
                          <span className="text-xs text-[#a89a7d]">Delivery Notes</span>
                          <span className="text-sm font-semibold text-[#2a2620]">
                            {shipping_details.delivery_notes}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#b8902e]/10 bg-[#faf8f3] p-5">
                <h4 className="mb-5 text-sm font-bold text-[#2a2620]">Order Timeline</h4>

                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#b8902e]/10">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#b8902e]" />
                      </div>
                      <div className="h-12 w-px bg-[#d4af52]/30" />
                    </div>

                    <div className="pt-1">
                      <p className="font-semibold text-[#2a2620]">Order Placed</p>
                      <p className="mt-1 text-xs text-[#a89a7d]">{formatDate(order_date)}</p>
                    </div>
                  </div>

                  {order_status !== "pending" && order_status !== "cancelled" && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d4af52]/15">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#c49b3a]" />
                        </div>
                        <div className="h-12 w-px bg-[#d4af52]/30" />
                      </div>

                      <div className="pt-1">
                        <p className="font-semibold text-[#2a2620]">Order Confirmed</p>
                        <p className="mt-1 text-xs text-[#a89a7d]">{formatDate(order_date)}</p>
                      </div>
                    </div>
                  )}

                  {(order_status === "dispatched" || order_status === "shipped" || order_status === "delivered" || order_status === "partial_delivered") && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#b8902e]/10">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#b8902e]" />
                        </div>
                        <div className="h-12 w-px bg-[#d4af52]/30" />
                      </div>

                      <div className="pt-1">
                        <p className="font-semibold text-[#2a2620]">
                          {order_status === "delivered" || order_status === "partial_delivered" ? "Delivered" : "Shipped"}
                        </p>
                        <p className="mt-1 text-xs text-[#a89a7d]">
                          {order_status === "delivered" || order_status === "partial_delivered"
                            ? formatDate(order_date)
                            : "In Transit"}
                        </p>
                      </div>
                    </div>
                  )}

                  {order_status === "cancelled" && (
                    <div className="flex gap-4">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#b46055]/10">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#b46055]" />
                      </div>

                      <div className="pt-1">
                        <p className="font-semibold text-[#b46055]">Order Cancelled</p>
                        <p className="mt-1 text-xs text-[#a89a7d]">{formatDate(order_date)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

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
      lineId?: number;
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

  useEffect(() => {
    if (isOpen) {
      setTrackingNumber("");
      setCourierName("");
      setExpectedDelivery("");
      setNotes("");
      setError(null);
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) {
    return null;
  }

  const itemsToDispatch = isFullOrder ? order.items || [] : selectedItems;

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
        dispatchData.items = itemsToDispatch.map(item => ({
          order_line_id: item.lineId || parseInt(item.id)
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
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

        <div className="sticky top-0 z-10 border-b border-[#b8902e]/10 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">Fulfillment</span>
              </div>

              <h2 className="flex items-center gap-2 text-xl font-bold text-[#2a2620]">
                <FiTruck className="text-[#a8841c]" />
                {isFullOrder ? "Dispatch Entire Order" : `Dispatch ${itemsToDispatch.length} Items`}
              </h2>

              <p className="mt-1 text-sm text-[#a89a7d]">
                {order.id} • {order.customer}
                {!isFullOrder && ` • ${itemsToDispatch.length} item(s) selected`}
                {isFullOrder && ` • All ${itemsToDispatch.length} item(s)`}
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

        <div className="max-h-[calc(95vh-180px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            {error && (
              <div className="rounded-xl border border-[#b46055]/20 bg-[#fff8f6] p-4 text-sm text-[#b46055]">
                <FiAlertCircle className="mr-2 inline" size={16} />
                {error}
              </div>
            )}

            <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3] p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#d4af52]/20" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Order Total</span>
                  <p className="mt-1 text-lg font-bold text-[#2a2620]">{order.total}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Items</span>
                  <p className="mt-1 text-lg font-bold text-[#8f6d1d]">
                    {itemsToDispatch.length}{" "}
                    <span className="text-xs font-semibold text-[#a89a7d]">{isFullOrder ? "(All)" : "(Selected)"}</span>
                  </p>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Shipping Address</span>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#4a4436]">{order.shippingAddress || "N/A"}</p>
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

            {itemsToDispatch.length > 0 && (
              <div className="rounded-2xl border border-[#b8902e]/15 bg-[#fffaf0] p-5">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2a2620]">
                  <FiPackage className="text-[#a8841c]" />
                  {isFullOrder ? "All Items in Order" : "Selected Items to Dispatch"}
                </h4>

                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {itemsToDispatch.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#b8902e]/10 bg-white p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="h-8 w-8 rounded-lg border border-[#b8902e]/10 object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#b8902e] flex-shrink-0">
                            <FiPackage size={12} />
                          </div>
                        )}
                        <span className="truncate text-sm font-semibold text-[#4a4436]">
                          {idx + 1}. {item.productName}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs text-[#a89a7d]">
                        Qty: {item.quantity} • SKU: {item.sku}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                  <FiTruck size={17} />
                </div>
                <h3 className="font-bold text-[#2a2620]">Tracking Details</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                    Tracking Number <span className="text-[#b46055]">*</span>
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                    Courier Name <span className="text-[#b46055]">*</span>
                  </label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="Enter courier name"
                    className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 text-sm text-[#2a2620] outline-none transition-all focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#6b6152]">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 py-3 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#b8902e]/10 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#b8902e]/20 bg-white px-4 py-3 text-sm font-semibold text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-3 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition hover:from-[#a8841c] hover:to-[#795b14] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <FiLoader size={17} className="animate-spin" />
                ) : (
                  <FiTruck size={17} />
                )}
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
// SHIP POPUP
// =====================================================

interface ShipPopupProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  selectedItems?: OrderItem[];
  onShip: (data: {
    orderId: string;
    items: { id: string; name: string; lineId?: number }[];
    itemCount: number;
    isFullOrder: boolean;
  }) => void;
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
    if (isOpen) {
      setError(null);
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) {
    return null;
  }

  const itemsToShip = isFullOrder ? order.items || [] : selectedItems;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const shipData: any = {
        order_reference: order.id,
      };

      if (!isFullOrder) {
        shipData.items = itemsToShip.map(item => ({
          order_line_id: item.lineId || parseInt(item.id)
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
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

        <div className="sticky top-0 z-10 border-b border-[#b8902e]/10 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">Shipment</span>
              </div>

              <h2 className="flex items-center gap-2 text-xl font-bold text-[#2a2620]">
                <FiSend className="text-[#a8841c]" />
                {isFullOrder ? "Ship Entire Order" : `Ship ${itemsToShip.length} Items`}
              </h2>

              <p className="mt-1 text-sm text-[#a89a7d]">
                {order.id} • {order.customer}
                {!isFullOrder && ` • ${itemsToShip.length} item(s) selected`}
                {isFullOrder && ` • All ${itemsToShip.length} item(s)`}
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

        <div className="max-h-[calc(95vh-180px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            {error && (
              <div className="rounded-xl border border-[#b46055]/20 bg-[#fff8f6] p-4 text-sm text-[#b46055]">
                <FiAlertCircle className="mr-2 inline" size={16} />
                {error}
              </div>
            )}

            <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3] p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#d4af52]/20" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Order Total</span>
                  <p className="mt-1 text-lg font-bold text-[#2a2620]">{order.total}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Items</span>
                  <p className="mt-1 text-lg font-bold text-[#8f6d1d]">
                    {itemsToShip.length}{" "}
                    <span className="text-xs font-semibold text-[#a89a7d]">{isFullOrder ? "(All)" : "(Selected)"}</span>
                  </p>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Shipping Address</span>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#4a4436]">{order.shippingAddress || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#b8902e]/15 bg-[#fffaf0] p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2a2620]">
                <FiPackage className="text-[#a8841c]" />
                {isFullOrder ? "All Items in Order" : "Selected Items to Ship"}
              </h4>

              <div className="max-h-48 space-y-2 overflow-y-auto">
                {itemsToShip.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-8 w-8 rounded-lg border border-[#b8902e]/10 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#b8902e] flex-shrink-0">
                          <FiPackage size={12} />
                        </div>
                      )}
                      <span className="truncate text-sm font-semibold text-[#4a4436]">
                        {idx + 1}. {item.productName}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-[#a89a7d]">
                      Qty: {item.quantity} • SKU: {item.sku}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#b8902e]/10 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#b8902e]/20 bg-white px-4 py-3 text-sm font-semibold text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-3 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition hover:from-[#a8841c] hover:to-[#795b14] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <FiLoader size={17} className="animate-spin" />
                ) : (
                  <FiSend size={17} />
                )}
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
// DELIVER POPUP
// =====================================================

interface DeliverPopupProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  selectedItems?: OrderItem[];
  onDeliver: (data: {
    orderId: string;
    items: { id: string; name: string; lineId?: number }[];
    itemCount: number;
    isFullOrder: boolean;
  }) => void;
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
    if (isOpen) {
      setError(null);
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) {
    return null;
  }

  const itemsToDeliver = isFullOrder ? order.items || [] : selectedItems;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const deliverData: any = {
        order_reference: order.id,
      };

      if (!isFullOrder) {
        deliverData.items = itemsToDeliver.map(item => ({
          order_line_id: item.lineId || parseInt(item.id)
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
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

        <div className="sticky top-0 z-10 border-b border-[#b8902e]/10 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#b8902e]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8902e]">Delivery</span>
              </div>

              <h2 className="flex items-center gap-2 text-xl font-bold text-[#2a2620]">
                <FiCheckCircle className="text-[#a8841c]" />
                {isFullOrder ? "Deliver Entire Order" : `Deliver ${itemsToDeliver.length} Items`}
              </h2>

              <p className="mt-1 text-sm text-[#a89a7d]">
                {order.id} • {order.customer}
                {!isFullOrder && ` • ${itemsToDeliver.length} item(s) selected`}
                {isFullOrder && ` • All ${itemsToDeliver.length} item(s)`}
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

        <div className="max-h-[calc(95vh-180px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            {error && (
              <div className="rounded-xl border border-[#b46055]/20 bg-[#fff8f6] p-4 text-sm text-[#b46055]">
                <FiAlertCircle className="mr-2 inline" size={16} />
                {error}
              </div>
            )}

            <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-[#faf8f3] p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-[#d4af52]/20" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Order Total</span>
                  <p className="mt-1 text-lg font-bold text-[#2a2620]">{order.total}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Items</span>
                  <p className="mt-1 text-lg font-bold text-[#8f6d1d]">
                    {itemsToDeliver.length}{" "}
                    <span className="text-xs font-semibold text-[#a89a7d]">{isFullOrder ? "(All)" : "(Selected)"}</span>
                  </p>
                </div>

                <div className="col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#a89a7d]">Shipping Address</span>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#4a4436]">{order.shippingAddress || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#b8902e]/15 bg-[#fffaf0] p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2a2620]">
                <FiPackage className="text-[#a8841c]" />
                {isFullOrder ? "All Items in Order" : "Selected Items to Deliver"}
              </h4>

              <div className="max-h-48 space-y-2 overflow-y-auto">
                {itemsToDeliver.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#b8902e]/10 bg-white p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-8 w-8 rounded-lg border border-[#b8902e]/10 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#b8902e] flex-shrink-0">
                          <FiPackage size={12} />
                        </div>
                      )}
                      <span className="truncate text-sm font-semibold text-[#4a4436]">
                        {idx + 1}. {item.productName}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-[#a89a7d]">
                      Qty: {item.quantity} • SKU: {item.sku}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#b8902e]/10 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#b8902e]/20 bg-white px-4 py-3 text-sm font-semibold text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-3 text-sm font-bold text-white shadow-md shadow-[#b8902e]/20 transition hover:from-[#a8841c] hover:to-[#795b14] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <FiLoader size={17} className="animate-spin" />
                ) : (
                  <FiCheckCircle size={17} />
                )}
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
// ORDERS TABLE
// =====================================================

interface OrdersTableProps {
  onSelectOrder: (order: Order) => void;
  selectedOrderId?: string;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  onSelectOrder,
  selectedOrderId,
}) => {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [statusFilter, setStatusFilter] = useState("Status: All");
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
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [selectedOrderIdForInvoice, setSelectedOrderIdForInvoice] = useState<number | null>(null);
  const [selectedOrderItemIdForInvoice, setSelectedOrderItemIdForInvoice] = useState<number | null>(null);
  const [viewOrderPopupInvoiceCallback, setViewOrderPopupInvoiceCallback] = useState<((orderId: number, itemId?: number) => void) | null>(null);

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

  // ===================================================
  // STATUS BADGE
  // ===================================================

  const getStatusBadge = (status: string) => {
    const lowerStatus = status?.toLowerCase() || "";
    switch (lowerStatus) {
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
      case "partial_dispatched":
      case "partial_shipped":
        return "border-[#d9a441]/30 bg-[#fff8e8] text-[#a06f13]";
      default:
        return "border-[#d8d1c4] bg-[#f6f4ef] text-[#857b6c]";
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return "N/A";
    return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // ===================================================
  // CONVERT API ORDER
  // ===================================================

  const convertToOrder = (apiOrder: any, index: number): Order => {
    return {
      id: apiOrder.order_reference,
      orderId: apiOrder.id,
      orderReference: apiOrder.order_reference,
      sNo: index + 1,
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
      items: apiOrder.items?.map((item: any) => ({
        id: String(item.line_id || item.id || ''),
        lineId: item.line_id || item.id,
        productName: item.product_name || "N/A",
        sku: item.product_code || "N/A",
        quantity: item.quantity || 0,
        price: `₹${Number(item.unit_price || 0).toLocaleString("en-IN")}`,
        total: `₹${Number(item.line_total || 0).toLocaleString("en-IN")}`,
        unitPrice: item.unit_price || 0,
        lineTotal: item.line_total || 0,
        status: item.delivery_status?.charAt(0).toUpperCase() + item.delivery_status?.slice(1) || "Pending",
        delivery_status: item.delivery_status || "pending",
        image: item.primary_image || item.product_image || undefined,
        productId: item.product_id,
        isReturnable: item.is_returnable,
        availableForReturn: item.available_for_return,
        gstRate: item.gst_rate,
        gstAmount: item.gst_amount,
      })) || [],
    };
  };

  // ===================================================
  // UI ORDERS
  // ===================================================

  const uiOrders = useMemo(() => {
    return orders.map((order, index) => convertToOrder(order, index));
  }, [orders]);

  // ===================================================
  // FILTER
  // ===================================================

  const filteredOrders = useMemo(() => {
    return uiOrders.filter((order) => {
      const searchText = search.toLowerCase().trim();

      const searchMatch =
        !searchText ||
        order.id.toLowerCase().includes(searchText) ||
        order.customer.toLowerCase().includes(searchText) ||
        order.customerName.toLowerCase().includes(searchText);

      const statusMatch =
        statusFilter === "Status: All" ||
        order.orderStatus === statusFilter.replace("Status: ", "");

      return searchMatch && statusMatch;
    });
  }, [uiOrders, search, statusFilter]);

  // ===================================================
  // PAGINATION
  // ===================================================

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));

  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const changePage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const clearFilters = () => {
    setSearch("");
    setDateFilter("All Dates");
    setStatusFilter("Status: All");
    setCurrentPage(1);
  };

  const hasActiveFilters = search !== "" || dateFilter !== "All Dates" || statusFilter !== "Status: All";

  // ===================================================
  // ROW
  // ===================================================

  const toggleRow = (orderId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  // ===================================================
  // VIEW ORDER
  // ===================================================

  const handleViewOrder = (orderId: string) => {
    const apiOrder = orders.find((o) => o.order_reference === orderId);

    if (apiOrder) {
      setSelectedOrderForView(apiOrder.order_reference);
      setSelectedOrderDataForView(apiOrder);
      setShowViewPopup(true);

      const uiOrder = uiOrders.find((o) => o.id === orderId);
      if (uiOrder) {
        onSelectOrder(uiOrder);
      }
    }
  };

  // ===================================================
  // VIEW INVOICE - ONLY FOR DELIVERED ORDERS
  // ===================================================

  const handleViewInvoice = (orderId: number) => {
    setSelectedOrderIdForInvoice(orderId);
    setSelectedOrderItemIdForInvoice(null);
    setShowInvoicePopup(true);
  };

  const handleViewInvoiceItem = (orderId: number, itemId: number) => {
    setSelectedOrderIdForInvoice(orderId);
    setSelectedOrderItemIdForInvoice(itemId);
    setShowInvoicePopup(true);
  };

  // This function is passed to ViewOrderPopup to handle invoice clicks from inside it
  const handleViewInvoiceFromViewPopup = (orderId: number, itemId?: number) => {
    if (itemId) {
      handleViewInvoiceItem(orderId, itemId);
    } else {
      handleViewInvoice(orderId);
    }
  };

  // ===================================================
  // ITEM SELECTION
  // ===================================================

  const toggleItemSelection = (orderId: string, itemId: string) => {
    const key = `${orderId}-${itemId}`;
    const newMap = new Map(selectedItemsMap);
    newMap.set(key, !newMap.get(key));
    setSelectedItemsMap(newMap);
  };

  const toggleAllItems = (orderId: string, items: OrderItem[]) => {
    if (items.length === 0) return;

    const dispatchableItems = items.filter(item => canItemDispatch(item));

    if (dispatchableItems.length === 0) return;

    const allSelected = dispatchableItems.every((item) =>
      selectedItemsMap.get(`${orderId}-${item.id}`)
    );

    const newMap = new Map(selectedItemsMap);

    dispatchableItems.forEach((item) => {
      newMap.set(`${orderId}-${item.id}`, !allSelected);
    });

    setSelectedItemsMap(newMap);
  };

  const getSelectedItemsForOrder = (orderId: string, items: OrderItem[]) => {
    return items.filter((item) => selectedItemsMap.get(`${orderId}-${item.id}`));
  };

  // ===================================================
  // ORDER STATUS HELPERS
  // ===================================================

  const canDispatch = (orderStatus: string) => {
    return orderStatus === "pending" ||
      orderStatus === "confirmed" ||
      orderStatus === "partial_dispatched";
  };

  const canShip = (orderStatus: string) => {
    return orderStatus === "dispatched" || orderStatus === "partial_dispatched";
  };

  const canDeliver = (orderStatus: string) => {
    return orderStatus === "shipped" || orderStatus === "partial_shipped";
  };

  const canItemDispatch = (item: OrderItem) => {
    const status = item.delivery_status || item.status?.toLowerCase() || "pending";
    return status === "pending" || status === "confirmed";
  };

  const canItemShip = (item: OrderItem) => {
    const status = item.delivery_status || item.status?.toLowerCase() || "pending";
    return status === "dispatched";
  };

  const canItemDeliver = (item: OrderItem) => {
    const status = item.delivery_status || item.status?.toLowerCase() || "pending";
    return status === "shipped";
  };

  const hasDispatchableItems = (order: Order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.some(item => canItemDispatch(item));
  };

  const hasShipableItems = (order: Order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.some(item => canItemShip(item));
  };

  const hasDeliverableItems = (order: Order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.some(item => canItemDeliver(item));
  };

  const allItemsDispatchable = (order: Order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.every(item => canItemDispatch(item));
  };

  const allItemsShipable = (order: Order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.every(item => canItemShip(item));
  };

  const allItemsDeliverable = (order: Order) => {
    if (!order.items || order.items.length === 0) return false;
    return order.items.every(item => canItemDeliver(item));
  };

  const getDispatchableItemsCount = (order: Order) => {
    if (!order.items) return 0;
    return order.items.filter(item => canItemDispatch(item)).length;
  };

  const getShipableItemsCount = (order: Order) => {
    if (!order.items) return 0;
    return order.items.filter(item => canItemShip(item)).length;
  };

  const getDeliverableItemsCount = (order: Order) => {
    if (!order.items) return 0;
    return order.items.filter(item => canItemDeliver(item)).length;
  };

  // ===================================================
  // DISPATCH
  // ===================================================

  const handleDispatchSelected = (order: Order) => {
    if (!canDispatch(order.orderStatus) && order.orderStatus !== "partial_dispatched") {
      toast.error(`Cannot dispatch order with status: ${formatStatus(order.orderStatus)}`);
      return;
    }

    const selectedItems = getSelectedItemsForOrder(order.id, order.items || []);

    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to dispatch.");
      return;
    }

    setIsFullOrderDispatch(false);
    setSelectedOrderForDispatch(order);
    setSelectedItemsForDispatch(selectedItems);
    setShowDispatchPopup(true);
  };

  const handleDispatchFullOrder = (order: Order) => {
    if (!canDispatch(order.orderStatus) && order.orderStatus !== "partial_dispatched") {
      toast.error(`Cannot dispatch order with status: ${formatStatus(order.orderStatus)}`);
      return;
    }

    if (!order.items || order.items.length === 0) {
      toast.error("This order has no items to dispatch.");
      return;
    }

    if (!hasDispatchableItems(order)) {
      toast.error("No items available for dispatch in this order.");
      return;
    }

    setIsFullOrderDispatch(true);
    setSelectedOrderForDispatch(order);
    setSelectedItemsForDispatch([]);
    setShowDispatchPopup(true);
  };

  const handleDispatchSubmit = (trackingDetails: {
    orderId: string;
    items: {
      id: string;
      name: string;
      sku: string;
      quantity: number;
      lineId?: number;
    }[];
    itemCount: number;
    trackingNumber: string;
    courierName: string;
    expectedDelivery: string;
    notes: string;
    isFullOrder: boolean;
  }) => {
    fetchOrders();
    setSelectedItemsMap(new Map());
  };

  // ===================================================
  // SHIP
  // ===================================================

  const handleShipSelected = (order: Order) => {
    if (!canShip(order.orderStatus) && order.orderStatus !== "partial_dispatched") {
      toast.error(`Cannot ship order with status: ${formatStatus(order.orderStatus)}`);
      return;
    }

    const selectedItems = getSelectedItemsForOrder(order.id, order.items || []);

    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to ship.");
      return;
    }

    setIsFullOrderShip(false);
    setSelectedOrderForShip(order);
    setSelectedItemsForShip(selectedItems);
    setShowShipPopup(true);
  };

  const handleShipFullOrder = (order: Order) => {
    if (!canShip(order.orderStatus) && order.orderStatus !== "partial_dispatched") {
      toast.error(`Cannot ship order with status: ${formatStatus(order.orderStatus)}`);
      return;
    }

    if (!order.items || order.items.length === 0) {
      toast.error("This order has no items to ship.");
      return;
    }

    if (!hasShipableItems(order)) {
      toast.error("No items available for shipping in this order.");
      return;
    }

    setIsFullOrderShip(true);
    setSelectedOrderForShip(order);
    setSelectedItemsForShip([]);
    setShowShipPopup(true);
  };

  const handleShipSubmit = (data: {
    orderId: string;
    items: { id: string; name: string; lineId?: number }[];
    itemCount: number;
    isFullOrder: boolean;
  }) => {
    fetchOrders();
    setSelectedItemsMap(new Map());
  };

  // ===================================================
  // DELIVER
  // ===================================================

  const handleDeliverSelected = (order: Order) => {
    if (!canDeliver(order.orderStatus) && order.orderStatus !== "partial_shipped") {
      toast.error(`Cannot deliver order with status: ${formatStatus(order.orderStatus)}`);
      return;
    }

    const selectedItems = getSelectedItemsForOrder(order.id, order.items || []);

    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to deliver.");
      return;
    }

    setIsFullOrderDeliver(false);
    setSelectedOrderForDeliver(order);
    setSelectedItemsForDeliver(selectedItems);
    setShowDeliverPopup(true);
  };

  const handleDeliverFullOrder = (order: Order) => {
    if (!canDeliver(order.orderStatus) && order.orderStatus !== "partial_shipped") {
      toast.error(`Cannot deliver order with status: ${formatStatus(order.orderStatus)}`);
      return;
    }

    if (!order.items || order.items.length === 0) {
      toast.error("This order has no items to deliver.");
      return;
    }

    if (!hasDeliverableItems(order)) {
      toast.error("No items available for delivery in this order.");
      return;
    }

    setIsFullOrderDeliver(true);
    setSelectedOrderForDeliver(order);
    setSelectedItemsForDeliver([]);
    setShowDeliverPopup(true);
  };

  const handleDeliverSubmit = (data: {
    orderId: string;
    items: { id: string; name: string; lineId?: number }[];
    itemCount: number;
    isFullOrder: boolean;
  }) => {
    fetchOrders();
    setSelectedItemsMap(new Map());
  };

  // ===================================================
  // CLOSE POPUPS
  // ===================================================

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

  const closeInvoicePopup = () => {
    setShowInvoicePopup(false);
    setSelectedOrderIdForInvoice(null);
    setSelectedOrderItemIdForInvoice(null);
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#b8902e]/15 bg-white p-10 shadow-sm">
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b8902e]/10 text-[#b8902e]">
            <FiLoader size={28} className="animate-spin" />
          </div>
          <p className="mt-4 text-sm font-bold text-[#2a2620]">Loading orders...</p>
          <p className="mt-1 text-xs text-[#a89a7d]">Please wait while we fetch your orders.</p>
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
          <p className="mt-4 text-sm font-bold text-[#b46055]">{error}</p>
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
        {/* FILTER CARD */}
        <div className="relative overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white p-4 shadow-sm sm:p-5">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#d4af52] via-[#c49b3a] to-[#8a6c1f]" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-[#d4af52]/20" />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <FiSearch size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a8841c]" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search orders, customers..."
                className="h-12 w-full rounded-xl border border-[#d8d0c0] bg-[#faf8f3] pl-11 pr-10 text-sm text-[#2a2620] outline-none transition-all placeholder:text-[#a89a7d] focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89a7d] transition hover:text-[#8f6d1d]"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-12 cursor-pointer appearance-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 pr-10 text-sm text-[#4a4436] outline-none transition-all focus:border-[#b8902e] focus:bg-white focus:ring-2 focus:ring-[#b8902e]/15"
                >
                  <option>Status: All</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#a89a7d]" size={16} />
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className={`h-12 rounded-xl px-4 text-sm font-semibold transition-all ${hasActiveFilters
                  ? "bg-[#b8902e]/10 text-[#8f6d1d] hover:bg-[#b8902e]/15"
                  : "text-[#a89a7d] hover:text-[#8f6d1d]"
                  }`}
              >
                <FiFilter size={15} className="mr-1.5 inline" />
                Clear Filters
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#b8902e]/15 bg-[#faf8f3] px-4 text-sm font-semibold text-[#786f60] transition hover:border-[#b8902e]/30 hover:bg-[#b8902e]/10 hover:text-[#8f6d1d] lg:hidden"
            >
              <FiFilter size={15} />
              Filters
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#b8902e] text-[10px] font-bold text-white">!</span>
              )}
            </button>
          </div>

          {showMobileFilters && (
            <div className="relative z-10 mt-4 space-y-3 border-t border-[#b8902e]/10 pt-4 lg:hidden">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border border-[#d8d0c0] bg-[#faf8f3] px-4 pr-10 text-sm text-[#4a4436] outline-none focus:border-[#b8902e]"
                >
                  <option>Status: All</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#a89a7d]" size={16} />
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="h-11 w-full rounded-xl bg-[#b8902e]/10 text-sm font-semibold text-[#8f6d1d] transition hover:bg-[#b8902e]/15"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* ORDER TABLE */}
        <div className="overflow-hidden rounded-2xl border border-[#b8902e]/15 bg-white shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#e8c97a] via-[#b8902e] to-[#8a6c1f]" />

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1080px] border-collapse">
              <thead>
                <tr className="bg-[#2f2a22]">
                  <th className="w-[45px] px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">
                    <FiChevronDown size={16} className="mx-auto opacity-50" />
                  </th>
                  <th className="w-[60px] px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">S.No</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Order ID</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Date</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Total</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Status</th>
                  <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#f3dfab]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleOrders.length > 0 ? (
                  visibleOrders.map((order, index) => (
                    <React.Fragment key={order.id}>
                      <tr
                        onClick={() => toggleRow(order.id)}
                        className={`group cursor-pointer border-b border-[#b8902e]/10 transition-colors ${selectedOrderId === order.id ? "bg-[#fffaf0]" : "bg-white hover:bg-[#faf8f3]"
                          }`}
                      >
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(order.id);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e]/10"
                          >
                            {expandedRows.has(order.id) ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-xs font-bold text-[#8f6d1d]">{order.sNo}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-[#faf8f3] px-3 py-1.5 text-xs font-bold tracking-wide text-[#4a4436]">
                            {order.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-[#786f60]">{order.date}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-[#2a2620]">{order.customer}</p>
                          <p className="mt-0.5 text-xs text-[#a89a7d]">{order.customerName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-[#8f6d1d]">{order.total}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${getStatusBadge(order.orderStatus)}`}>
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
                              className="group/view relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition-all hover:border-[#b8902e] hover:bg-[#b8902e] hover:text-white hover:shadow-md hover:shadow-[#b8902e]/20"
                              title="View Order"
                            >
                              <FiEye size={16} />
                              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold text-[#a89a7d] opacity-0 transition-opacity group-hover/view:opacity-100">View</span>
                            </button>

                            {(canDispatch(order.orderStatus) || order.orderStatus === "partial_dispatched") && hasDispatchableItems(order) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDispatchFullOrder(order);
                                }}
                                className="group/dispatch relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition-all hover:border-[#8f6d1d] hover:bg-[#8f6d1d] hover:text-white hover:shadow-md hover:shadow-[#8f6d1d]/20"
                                title="Dispatch Order"
                              >
                                <FiTruck size={16} />
                                {order.orderStatus === "partial_dispatched" && getDispatchableItemsCount(order) > 0 && (
                                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#b8902e] text-[8px] font-bold text-white">
                                    {getDispatchableItemsCount(order)}
                                  </span>
                                )}
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold text-[#a89a7d] opacity-0 transition-opacity group-hover/dispatch:opacity-100">Dispatch</span>
                              </button>
                            )}

                            {(canShip(order.orderStatus) || order.orderStatus === "partial_dispatched") && hasShipableItems(order) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShipFullOrder(order);
                                }}
                                className="group/ship relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition-all hover:border-[#b8902e] hover:bg-[#b8902e] hover:text-white hover:shadow-md hover:shadow-[#b8902e]/20"
                                title="Ship Order"
                              >
                                <FiSend size={16} />
                                {(order.orderStatus === "partial_dispatched" || order.orderStatus === "partial_shipped") && getShipableItemsCount(order) > 0 && (
                                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#b8902e] text-[8px] font-bold text-white">
                                    {getShipableItemsCount(order)}
                                  </span>
                                )}
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold text-[#a89a7d] opacity-0 transition-opacity group-hover/ship:opacity-100">Ship</span>
                              </button>
                            )}

                            {(canDeliver(order.orderStatus) || order.orderStatus === "partial_shipped") && hasDeliverableItems(order) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeliverFullOrder(order);
                                }}
                                className="group/deliver relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition-all hover:border-[#b8902e] hover:bg-[#b8902e] hover:text-white hover:shadow-md hover:shadow-[#b8902e]/20"
                                title="Deliver Order"
                              >
                                <FiCheckCircle size={16} />
                                {order.orderStatus === "partial_shipped" && getDeliverableItemsCount(order) > 0 && (
                                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#b8902e] text-[8px] font-bold text-white">
                                    {getDeliverableItemsCount(order)}
                                  </span>
                                )}
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold text-[#a89a7d] opacity-0 transition-opacity group-hover/deliver:opacity-100">Deliver</span>
                              </button>
                            )}

                            {/* Invoice Button - ONLY FOR DELIVERED ORDERS */}
                            {order.orderStatus === "delivered" && order.orderId && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewInvoice(order.orderId!);
                                }}
                                className="group/invoice relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#b8902e]/20 bg-[#faf8f3] text-[#8f6d1d] transition-all hover:border-[#b8902e] hover:bg-[#b8902e] hover:text-white hover:shadow-md hover:shadow-[#b8902e]/20"
                                title="View Invoice"
                              >
                                <FiFileText size={16} />
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold text-[#a89a7d] opacity-0 transition-opacity group-hover/invoice:opacity-100">Invoice</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED ROW */}
                      {expandedRows.has(order.id) && (
                        <tr>
                          <td colSpan={8} className="bg-[#faf8f3] px-6 py-0">
                            <div className="overflow-hidden">
                              <div className="animate-slideDown py-5">
                                <div className="space-y-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b8902e]/10 text-[#a8841c]">
                                        <FiPackage size={16} />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-bold text-[#2a2620]">Order Items</h4>
                                        <p className="text-xs text-[#a89a7d]">
                                          {order.items?.length || 0} items in this order
                                          {order.orderStatus === "partial_dispatched" && (
                                            <span className="ml-2 text-[#b8902e]">({getDispatchableItemsCount(order)} pending dispatch)</span>
                                          )}
                                          {order.orderStatus === "partial_shipped" && (
                                            <span className="ml-2 text-[#b8902e]">({getShipableItemsCount(order)} pending ship)</span>
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      {hasDispatchableItems(order) && (canDispatch(order.orderStatus) || order.orderStatus === "partial_dispatched") && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDispatchFullOrder(order);
                                          }}
                                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a8841c] hover:to-[#795b14]"
                                        >
                                          <FiTruck size={14} />
                                          {allItemsDispatchable(order) ? "Dispatch All" : `Dispatch ${getDispatchableItemsCount(order)}`}
                                        </button>
                                      )}

                                      {hasShipableItems(order) && (canShip(order.orderStatus) || order.orderStatus === "partial_dispatched") && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleShipFullOrder(order);
                                          }}
                                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a8841c] hover:to-[#795b14]"
                                        >
                                          <FiSend size={14} />
                                          {allItemsShipable(order) ? "Ship All" : `Ship ${getShipableItemsCount(order)}`}
                                        </button>
                                      )}

                                      {hasDeliverableItems(order) && (canDeliver(order.orderStatus) || order.orderStatus === "partial_shipped") && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeliverFullOrder(order);
                                          }}
                                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a8841c] hover:to-[#795b14]"
                                        >
                                          <FiCheckCircle size={14} />
                                          {allItemsDeliverable(order) ? "Deliver All" : `Deliver ${getDeliverableItemsCount(order)}`}
                                        </button>
                                      )}

                                      {hasDispatchableItems(order) && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleAllItems(order.id, order.items || []);
                                          }}
                                          className="text-xs font-bold text-[#a8841c]"
                                        >
                                          {order.items &&
                                            order.items.length > 0 &&
                                            order.items.filter(item => canItemDispatch(item)).every((item) =>
                                              selectedItemsMap.get(`${order.id}-${item.id}`)
                                            )
                                            ? "Deselect All"
                                            : "Select All"}
                                        </button>
                                      )}

                                      {/* Invoice Button in Expanded Header - ONLY FOR DELIVERED ORDERS */}
                                      {order.orderStatus === "delivered" && order.orderId && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewInvoice(order.orderId!);
                                          }}
                                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#b8902e]/15 transition hover:from-[#a8841c] hover:to-[#795b14]"
                                        >
                                          <FiFileText size={14} />
                                          View Invoice
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Expanded Items Table with Images */}
                                  <div className="overflow-x-auto rounded-2xl border border-[#b8902e]/15 bg-white">
                                    <table className="w-full min-w-[900px] border-collapse">
                                      <thead>
                                        <tr className="border-b border-[#b8902e]/10 bg-[#fffdfa]">
                                          <th className="w-[45px] px-4 py-3 text-center">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleAllItems(order.id, order.items || []);
                                              }}
                                              className="text-[#8f6d1d] hover:text-[#b8902e]"
                                            >
                                              {order.items &&
                                                order.items.length > 0 &&
                                                order.items.filter(item => canItemDispatch(item)).every(
                                                  (item) => selectedItemsMap.get(`${order.id}-${item.id}`)
                                                ) ? (
                                                <FiCheck size={16} />
                                              ) : (
                                                <FiSquare size={16} />
                                              )}
                                            </button>
                                          </th>
                                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">#</th>
                                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">Product</th>
                                          <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">SKU</th>
                                          <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">Qty</th>
                                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">Price</th>
                                          <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">Total</th>
                                          <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">Status</th>
                                          <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">Action</th>
                                          <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#a89a7d]">Invoice</th>
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {(order.items || []).map((item, idx) => {
                                          const isSelected = selectedItemsMap.get(`${order.id}-${item.id}`);
                                          const isDispatchable = canItemDispatch(item);
                                          const isShipable = canItemShip(item);
                                          const isDeliverable = canItemDeliver(item);
                                          const isDisabled = !isDispatchable && !isShipable && !isDeliverable;
                                          const isDelivered = item.delivery_status?.toLowerCase() === "delivered";

                                          return (
                                            <tr
                                              key={item.id}
                                              className={`border-b border-[#b8902e]/10 last:border-0 ${isSelected ? "bg-[#fffaf0]" : "hover:bg-[#faf8f3]"
                                                } ${isDisabled ? "opacity-60" : ""}`}
                                            >
                                              <td className="px-4 py-3 text-center">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isDispatchable) {
                                                      toggleItemSelection(order.id, item.id);
                                                    }
                                                  }}
                                                  className={`text-[#8f6d1d] hover:text-[#b8902e] ${isDisabled || !isDispatchable ? "cursor-not-allowed opacity-40" : ""
                                                    }`}
                                                  disabled={isDisabled || !isDispatchable}
                                                  title={isDispatchable ? "Select item" : "Item cannot be selected"}
                                                >
                                                  {isSelected ? <FiCheck size={17} /> : <FiSquare size={17} />}
                                                </button>
                                              </td>

                                              <td className="px-4 py-3 text-xs text-[#8f6d1d]">{idx + 1}</td>

                                              <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                  {item.image ? (
                                                    <img
                                                      src={item.image}
                                                      alt={item.productName}
                                                      className="h-8 w-8 rounded-lg border border-[#b8902e]/10 object-cover flex-shrink-0"
                                                    />
                                                  ) : (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#b8902e] flex-shrink-0">
                                                      <FiPackage size={12} />
                                                    </div>
                                                  )}
                                                  <span className="text-sm font-medium text-[#4a4436]">{item.productName}</span>
                                                </div>
                                              </td>

                                              <td className="px-4 py-3">
                                                <span className="text-xs text-[#a89a7d]">{item.sku}</span>
                                              </td>

                                              <td className="px-4 py-3 text-center text-sm text-[#4a4436]">{item.quantity}</td>

                                              <td className="px-4 py-3 text-right text-sm text-[#786f60]">{item.price}</td>

                                              <td className="px-4 py-3 text-right text-sm font-bold text-[#2a2620]">{item.total}</td>

                                              <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusBadge(item.status)}`}>
                                                  {formatStatus(item.status)}
                                                </span>
                                              </td>

                                              <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                  {isDispatchable && (
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        const itemsToDispatch = [item];
                                                        setIsFullOrderDispatch(false);
                                                        setSelectedOrderForDispatch(order);
                                                        setSelectedItemsForDispatch(itemsToDispatch);
                                                        setShowDispatchPopup(true);
                                                      }}
                                                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
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
                                                        const itemsToShip = [item];
                                                        setIsFullOrderShip(false);
                                                        setSelectedOrderForShip(order);
                                                        setSelectedItemsForShip(itemsToShip);
                                                        setShowShipPopup(true);
                                                      }}
                                                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                                                      title="Ship this item"
                                                    >
                                                      <FiSend size={13} />
                                                    </button>
                                                  )}

                                                  {isDeliverable && (
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        const itemsToDeliver = [item];
                                                        setIsFullOrderDeliver(false);
                                                        setSelectedOrderForDeliver(order);
                                                        setSelectedItemsForDeliver(itemsToDeliver);
                                                        setShowDeliverPopup(true);
                                                      }}
                                                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                                                      title="Deliver this item"
                                                    >
                                                      <FiCheckCircle size={13} />
                                                    </button>
                                                  )}

                                                  {isDisabled && (
                                                    <span className="text-[10px] text-[#a89a7d]">✓</span>
                                                  )}
                                                </div>
                                              </td>

                                              <td className="px-4 py-3 text-center">
                                                {/* Invoice button for item - ONLY FOR DELIVERED ITEMS */}
                                                {isDelivered && order.orderId && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleViewInvoiceItem(order.orderId!, item.lineId || parseInt(item.id));
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-[#b8902e]/10 px-2.5 py-1 text-[10px] font-bold text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                                                  >
                                                    <FiFileText size={11} />
                                                    Invoice
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Expanded Footer */}
                                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#b8902e]/10 pt-4">
                                    <div className="flex min-w-0 items-center gap-2 text-xs text-[#786f60]">
                                      <FiMapPin size={14} className="shrink-0 text-[#a8841c]" />
                                      <span className="truncate">{order.shippingAddress || "No address"}</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewOrder(order.id);
                                        }}
                                        className="rounded-xl border border-[#b8902e]/20 bg-white px-4 py-2 text-xs font-semibold text-[#8f6d1d] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3]"
                                      >
                                        <FiEye size={14} className="mr-1.5 inline" />
                                        View Details
                                      </button>

                                      {hasDispatchableItems(order) && (canDispatch(order.orderStatus) || order.orderStatus === "partial_dispatched") && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDispatchSelected(order);
                                          }}
                                          className="flex items-center gap-1.5 rounded-xl bg-[#2f2a22] px-4 py-2 text-xs font-bold text-[#f3dfab] transition hover:bg-[#403a30]"
                                        >
                                          <FiTruck size={14} />
                                          Dispatch Selected ({getSelectedItemsForOrder(order.id, order.items || []).length})
                                        </button>
                                      )}

                                      {hasShipableItems(order) && (canShip(order.orderStatus) || order.orderStatus === "partial_dispatched") && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleShipSelected(order);
                                          }}
                                          className="flex items-center gap-1.5 rounded-xl bg-[#2f2a22] px-4 py-2 text-xs font-bold text-[#f3dfab] transition hover:bg-[#403a30]"
                                        >
                                          <FiSend size={14} />
                                          Ship Selected ({getSelectedItemsForOrder(order.id, order.items || []).length})
                                        </button>
                                      )}

                                      {hasDeliverableItems(order) && (canDeliver(order.orderStatus) || order.orderStatus === "partial_shipped") && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeliverSelected(order);
                                          }}
                                          className="flex items-center gap-1.5 rounded-xl bg-[#2f2a22] px-4 py-2 text-xs font-bold text-[#f3dfab] transition hover:bg-[#403a30]"
                                        >
                                          <FiCheckCircle size={14} />
                                          Deliver Selected ({getSelectedItemsForOrder(order.id, order.items || []).length})
                                        </button>
                                      )}

                                      {/* Invoice Button in Expanded Footer - ONLY FOR DELIVERED ORDERS */}
                                      {order.orderStatus === "delivered" && order.orderId && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewInvoice(order.orderId!);
                                          }}
                                          className="flex items-center gap-1.5 rounded-xl bg-[#2f2a22] px-4 py-2 text-xs font-bold text-[#f3dfab] transition hover:bg-[#403a30]"
                                        >
                                          <FiFileText size={14} />
                                          View Invoice
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                          <FiSearch size={24} />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#2a2620]">No orders found</p>
                        <p className="mt-1 text-xs text-[#a89a7d]">Try adjusting your filters or search criteria.</p>
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
              visibleOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => toggleRow(order.id)}
                  className={`cursor-pointer border-b border-[#b8902e]/10 p-5 transition-colors ${selectedOrderId === order.id ? "bg-[#fffaf0]" : "bg-white hover:bg-[#faf8f3]"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-lg bg-[#faf8f3] px-2.5 py-1 text-xs font-bold text-[#4a4436]">
                        {order.id}
                      </span>
                      <p className="mt-2 text-xs text-[#a89a7d]">{order.date}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrder(order.id);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d]"
                      >
                        <FiEye size={15} />
                      </button>
                      {(canDispatch(order.orderStatus) || order.orderStatus === "partial_dispatched") && hasDispatchableItems(order) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDispatchFullOrder(order);
                          }}
                          className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d]"
                          title="Dispatch"
                        >
                          <FiTruck size={15} />
                          {order.orderStatus === "partial_dispatched" && getDispatchableItemsCount(order) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#b8902e] text-[8px] font-bold text-white">
                              {getDispatchableItemsCount(order)}
                            </span>
                          )}
                        </button>
                      )}
                      {(canShip(order.orderStatus) || order.orderStatus === "partial_dispatched") && hasShipableItems(order) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShipFullOrder(order);
                          }}
                          className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d]"
                          title="Ship"
                        >
                          <FiSend size={15} />
                          {(order.orderStatus === "partial_dispatched" || order.orderStatus === "partial_shipped") && getShipableItemsCount(order) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#b8902e] text-[8px] font-bold text-white">
                              {getShipableItemsCount(order)}
                            </span>
                          )}
                        </button>
                      )}
                      {(canDeliver(order.orderStatus) || order.orderStatus === "partial_shipped") && hasDeliverableItems(order) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeliverFullOrder(order);
                          }}
                          className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d]"
                          title="Deliver"
                        >
                          <FiCheckCircle size={15} />
                          {order.orderStatus === "partial_shipped" && getDeliverableItemsCount(order) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#b8902e] text-[8px] font-bold text-white">
                              {getDeliverableItemsCount(order)}
                            </span>
                          )}
                        </button>
                      )}
                      {/* Invoice Button in Mobile - ONLY FOR DELIVERED ORDERS */}
                      {order.orderStatus === "delivered" && order.orderId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewInvoice(order.orderId!);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#8f6d1d]"
                          title="Invoice"
                        >
                          <FiFileText size={15} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(order.id);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faf8f3] text-[#786f60]"
                      >
                        {expandedRows.has(order.id) ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-bold text-[#2a2620]">{order.customer}</p>
                    <p className="mt-0.5 text-xs text-[#a89a7d]">{order.customerName}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-base font-bold text-[#8f6d1d]">{order.total}</span>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusBadge(order.orderStatus)}`}>
                      {formatStatus(order.orderStatus)}
                    </span>
                  </div>

                  {/* MOBILE EXPANDED */}
                  {expandedRows.has(order.id) && (
                    <div className="mt-4 animate-slideDown border-t border-[#b8902e]/10 pt-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-[#6b6152]">Items</h5>
                          <p className="mt-0.5 text-[11px] text-[#a89a7d]">
                            {order.items?.length || 0} items
                            {order.orderStatus === "partial_dispatched" && (
                              <span className="ml-2 text-[#b8902e]">({getDispatchableItemsCount(order)} pending dispatch)</span>
                            )}
                            {order.orderStatus === "partial_shipped" && (
                              <span className="ml-2 text-[#b8902e]">({getShipableItemsCount(order)} pending ship)</span>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {hasDispatchableItems(order) && (canDispatch(order.orderStatus) || order.orderStatus === "partial_dispatched") && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDispatchFullOrder(order);
                              }}
                              className="text-xs font-bold text-[#8f6d1d]"
                            >
                              <FiTruck size={13} className="mr-1 inline" />
                              {allItemsDispatchable(order) ? "Dispatch All" : `Dispatch ${getDispatchableItemsCount(order)}`}
                            </button>
                          )}
                          {hasShipableItems(order) && (canShip(order.orderStatus) || order.orderStatus === "partial_dispatched") && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShipFullOrder(order);
                              }}
                              className="text-xs font-bold text-[#8f6d1d]"
                            >
                              <FiSend size={13} className="mr-1 inline" />
                              {allItemsShipable(order) ? "Ship All" : `Ship ${getShipableItemsCount(order)}`}
                            </button>
                          )}
                          {hasDeliverableItems(order) && (canDeliver(order.orderStatus) || order.orderStatus === "partial_shipped") && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeliverFullOrder(order);
                              }}
                              className="text-xs font-bold text-[#8f6d1d]"
                            >
                              <FiCheckCircle size={13} className="mr-1 inline" />
                              {allItemsDeliverable(order) ? "Deliver All" : `Deliver ${getDeliverableItemsCount(order)}`}
                            </button>
                          )}
                          {hasDispatchableItems(order) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAllItems(order.id, order.items || []);
                              }}
                              className="text-xs font-bold text-[#a8841c]"
                            >
                              {order.items &&
                                order.items.length > 0 &&
                                order.items.filter(item => canItemDispatch(item)).every((item) =>
                                  selectedItemsMap.get(`${order.id}-${item.id}`)
                                )
                                ? "Deselect All"
                                : "Select All"}
                            </button>
                          )}
                          {/* Invoice Button in Mobile Expanded - ONLY FOR DELIVERED ORDERS */}
                          {order.orderStatus === "delivered" && order.orderId && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoice(order.orderId!);
                              }}
                              className="text-xs font-bold text-[#8f6d1d]"
                            >
                              <FiFileText size={13} className="mr-1 inline" />
                              Invoice
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {(order.items || []).map((item) => {
                          const isSelected = selectedItemsMap.get(`${order.id}-${item.id}`);
                          const isDispatchable = canItemDispatch(item);
                          const isShipable = canItemShip(item);
                          const isDeliverable = canItemDeliver(item);
                          const isDisabled = !isDispatchable && !isShipable && !isDeliverable;
                          const isDelivered = item.delivery_status?.toLowerCase() === "delivered";

                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${isSelected ? "border-[#b8902e]/25 bg-[#fffaf0]" : "border-[#b8902e]/10 bg-[#faf8f3]"
                                } ${isDisabled ? "opacity-60" : ""}`}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isDispatchable) {
                                    toggleItemSelection(order.id, item.id);
                                  }
                                }}
                                className={`shrink-0 text-[#8f6d1d] ${isDisabled || !isDispatchable ? "cursor-not-allowed opacity-40" : ""
                                  }`}
                                disabled={isDisabled || !isDispatchable}
                              >
                                {isSelected ? <FiCheck size={16} /> : <FiSquare size={16} />}
                              </button>

                              <div className="ml-1 min-w-0 flex-1 flex items-center gap-2">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.productName}
                                    className="h-8 w-8 rounded-lg border border-[#b8902e]/10 object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#2a2620]">{item.productName}</p>
                                  <p className="mt-0.5 truncate text-[11px] text-[#a89a7d]">
                                    SKU: {item.sku}
                                    {isShipable && <span className="ml-2 text-[10px] font-semibold text-[#b8902e]">(Ready to Ship)</span>}
                                    {isDeliverable && <span className="ml-2 text-[10px] font-semibold text-[#b8902e]">(Ready to Deliver)</span>}
                                    {isDisabled && <span className="ml-2 text-[10px] font-semibold text-[#8f6d1d]">(Completed)</span>}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {isDispatchable && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const itemsToDispatch = [item];
                                      setIsFullOrderDispatch(false);
                                      setSelectedOrderForDispatch(order);
                                      setSelectedItemsForDispatch(itemsToDispatch);
                                      setShowDispatchPopup(true);
                                    }}
                                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#b8902e]/10 text-[#8f6d1d]"
                                  >
                                    <FiTruck size={11} />
                                  </button>
                                )}
                                {isShipable && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const itemsToShip = [item];
                                      setIsFullOrderShip(false);
                                      setSelectedOrderForShip(order);
                                      setSelectedItemsForShip(itemsToShip);
                                      setShowShipPopup(true);
                                    }}
                                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#b8902e]/10 text-[#8f6d1d]"
                                  >
                                    <FiSend size={11} />
                                  </button>
                                )}
                                {isDeliverable && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const itemsToDeliver = [item];
                                      setIsFullOrderDeliver(false);
                                      setSelectedOrderForDeliver(order);
                                      setSelectedItemsForDeliver(itemsToDeliver);
                                      setShowDeliverPopup(true);
                                    }}
                                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#b8902e]/10 text-[#8f6d1d]"
                                  >
                                    <FiCheckCircle size={11} />
                                  </button>
                                )}
                                {/* Invoice button for item in mobile - ONLY FOR DELIVERED ITEMS */}
                                {isDelivered && order.orderId && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewInvoiceItem(order.orderId!, item.lineId || parseInt(item.id));
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#b8902e]/10 px-2.5 py-1 text-[10px] font-bold text-[#8f6d1d] transition hover:bg-[#b8902e] hover:text-white"
                                  >
                                    <FiFileText size={11} />
                                    Invoice
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {hasDispatchableItems(order) && (canDispatch(order.orderStatus) || order.orderStatus === "partial_dispatched") && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDispatchSelected(order);
                            }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15"
                          >
                            <FiTruck size={14} />
                            Dispatch Selected ({getSelectedItemsForOrder(order.id, order.items || []).length})
                          </button>
                        )}
                        {hasShipableItems(order) && (canShip(order.orderStatus) || order.orderStatus === "partial_dispatched") && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShipSelected(order);
                            }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15"
                          >
                            <FiSend size={14} />
                            Ship Selected ({getSelectedItemsForOrder(order.id, order.items || []).length})
                          </button>
                        )}
                        {hasDeliverableItems(order) && (canDeliver(order.orderStatus) || order.orderStatus === "partial_shipped") && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeliverSelected(order);
                            }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15"
                          >
                            <FiCheckCircle size={14} />
                            Deliver Selected ({getSelectedItemsForOrder(order.id, order.items || []).length})
                          </button>
                        )}
                        {/* Invoice Button in Mobile Expanded Footer - ONLY FOR DELIVERED ORDERS */}
                        {order.orderStatus === "delivered" && order.orderId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewInvoice(order.orderId!);
                            }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b8902e] to-[#8f6d1d] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#b8902e]/15"
                          >
                            <FiFileText size={14} />
                            View Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf8f3] text-[#b8902e]">
                  <FiSearch size={24} />
                </div>
                <p className="mt-4 text-sm font-bold text-[#2a2620]">No orders found</p>
                <p className="mt-1 text-xs text-[#a89a7d]">Try adjusting your filters.</p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredOrders.length > 0 && (
            <div className="border-t border-[#b8902e]/10 bg-[#fffdfa] px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[#8b8171]">
                  Showing{" "}
                  <span className="font-bold text-[#4a4436]">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-bold text-[#4a4436]">
                    {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
                  </span>{" "}
                  of <span className="font-bold text-[#4a4436]">{filteredOrders.length}</span> entries
                </p>

                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-30"
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
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${currentPage === page
                          ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white shadow-md shadow-[#b8902e]/20"
                          : "text-[#786f60] hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {totalPages > 3 && (
                    <>
                      <span className="px-1 text-xs text-[#a89a7d]">...</span>
                      <button
                        type="button"
                        onClick={() => changePage(totalPages)}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${currentPage === totalPages
                          ? "bg-gradient-to-br from-[#d4af52] to-[#a8841c] text-white"
                          : "text-[#786f60] hover:bg-[#faf8f3] hover:text-[#8f6d1d]"
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
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#b8902e]/15 bg-white text-[#8f6d1d] transition hover:border-[#b8902e]/30 hover:bg-[#faf8f3] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiChevronRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW ORDER POPUP */}
      <ViewOrderPopup
        isOpen={showViewPopup}
        onClose={closeViewPopup}
        orderId={selectedOrderForView}
        orderData={selectedOrderDataForView}
      />

      {/* DISPATCH POPUP */}
      <DispatchPopup
        isOpen={showDispatchPopup}
        onClose={closeDispatchPopup}
        order={selectedOrderForDispatch}
        selectedItems={selectedItemsForDispatch}
        onDispatch={handleDispatchSubmit}
        isFullOrder={isFullOrderDispatch}
      />

      {/* SHIP POPUP */}
      <ShipPopup
        isOpen={showShipPopup}
        onClose={closeShipPopup}
        order={selectedOrderForShip}
        selectedItems={selectedItemsForShip}
        onShip={handleShipSubmit}
        isFullOrder={isFullOrderShip}
      />

      {/* DELIVER POPUP */}
      <DeliverPopup
        isOpen={showDeliverPopup}
        onClose={closeDeliverPopup}
        order={selectedOrderForDeliver}
        selectedItems={selectedItemsForDeliver}
        onDeliver={handleDeliverSubmit}
        isFullOrder={isFullOrderDeliver}
      />

      {/* INVOICE POPUP */}
      <InvoiceViewPopup
        isOpen={showInvoicePopup}
        onClose={closeInvoicePopup}
        orderId={selectedOrderIdForInvoice}
        orderItemId={selectedOrderItemIdForInvoice}
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

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
      sNo: index + 1,
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
      items: apiOrder.items?.map((item: any) => ({
        id: String(item.line_id || item.id || ''),
        lineId: item.line_id || item.id,
        productName: item.product_name || "N/A",
        sku: item.product_code || "N/A",
        quantity: item.quantity,
        price: `₹${Number(item.unit_price || 0).toLocaleString("en-IN")}`,
        total: `₹${Number(item.line_total || 0).toLocaleString("en-IN")}`,
        unitPrice: item.unit_price || 0,
        lineTotal: item.line_total || 0,
        status: item.delivery_status?.charAt(0).toUpperCase() + item.delivery_status?.slice(1) || "Pending",
        delivery_status: item.delivery_status || "pending",
        image: item.primary_image || item.product_image || undefined,
        productId: item.product_id,
        isReturnable: item.is_returnable,
        availableForReturn: item.available_for_return,
        gstRate: item.gst_rate,
        gstAmount: item.gst_amount,
      })) || [],
    };
  };

  const uiOrders = useMemo(() => {
    return ordersData.map((order, index) => convertToOrder(order, index));
  }, [ordersData]);

  const totalEarnings = useMemo(() => {
    return ordersData.reduce((sum, order) => {
      return sum + (order.total_payable || 0);
    }, 0);
  }, [ordersData]);

  const statsData = useMemo(() => {
    const total = uiOrders.length;
    const confirmed = uiOrders.filter((o) => o.orderStatus === "confirmed" || o.orderStatus === "processing").length;
    const delivered = uiOrders.filter((o) => o.orderStatus === "delivered" || o.orderStatus === "partial_delivered").length;

    return [
      {
        title: "Total Orders",
        value: total,
        icon: <span className="text-[#b8902e]"><ClipboardIcon /></span>,
        barColor: "bg-[#b8902e]",
        textColor: "text-[#b8902e]",
        valueColor: "text-[#8f6d1d]",
      },
      {
        title: "Total Earnings",
        value: `₹${totalEarnings.toLocaleString("en-IN")}`,
        icon: <span className="text-[#c49b3a]"><DollarIcon /></span>,
        barColor: "bg-[#c49b3a]",
        textColor: "text-[#a06f13]",
        valueColor: "text-[#8f6d1d]",
      },
      {
        title: "Confirmed Orders",
        value: confirmed,
        icon: <span className="text-[#a8841c]"><CreditCardIcon /></span>,
        barColor: "bg-[#a8841c]",
        textColor: "text-[#8f6d1d]",
        valueColor: "text-[#8f6d1d]",
      },
      {
        title: "Delivered Orders",
        value: delivered,
        icon: <span className="text-[#806319]"><CheckCircleIcon /></span>,
        barColor: "bg-[#806319]",
        textColor: "text-[#806319]",
        valueColor: "text-[#705813]",
      },
    ];
  }, [uiOrders, totalEarnings]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] p-4">
      <div className="mb-5">
        <div className="mb-1 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#b8902e]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b8902e]">Order Management</span>
        </div>
        <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#2a2620] sm:text-[30px]">Orders</h1>
        <p className="mt-1 text-sm text-[#786f60]">Manage orders, dispatch, shipping, and delivery from one place.</p>
      </div>

      {loading ? (
        <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-[135px] animate-pulse rounded-2xl border border-[#b8902e]/10 bg-white" />
          ))}
        </div>
      ) : (
        <div className="mb-5">
          <StatsCard stats={statsData} />
        </div>
      )}

      <div className="min-w-0">
        <OrdersTable onSelectOrder={handleSelectOrder} selectedOrderId={selectedOrder?.id} />
      </div>
    </div>
  );
};

export default Orders;