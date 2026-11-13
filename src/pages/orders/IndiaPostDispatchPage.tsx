import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiAlertCircle } from "react-icons/fi";

import IndiaPostDispatchPanel from "./IndiaPostDispatchPanel";

/**
 * India Post Dispatch Page
 *
 * Route: /indiapost-dispatch/:orderReference
 *
 * - Supports Order Reference based dispatch.
 * - Existing numeric Order ID links remain supported.
 * - IndiaPostDispatchPanel resolves Order Reference to
 *   the actual numeric Order ID.
 * - No automatic AWB allocation or booking.
 */
export default function IndiaPostDispatchPage() {
  const { orderReference } = useParams<{
    orderReference: string;
  }>();

  const navigate = useNavigate();

  const back = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const referenceFromUrl = (orderReference ?? "").trim();

  // Backward compatibility for numeric Order ID URLs.
  const numericValue = /^[1-9]\d*$/.test(referenceFromUrl)
    ? Number(referenceFromUrl)
    : NaN;

  const legacyOrderId =
    Number.isSafeInteger(numericValue) && numericValue > 0
      ? numericValue
      : undefined;

  if (!referenceFromUrl) {
    return (
      <div className="min-h-screen bg-[#F4F8FD] p-4 sm:p-5">
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8">
          <div className="flex flex-col items-center text-center">
            <FiAlertCircle size={28} className="text-red-600" />

            <p className="mt-3 text-sm font-semibold text-red-800">
              Missing order reference in URL.
            </p>

            <button
              type="button"
              onClick={back}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8FD] p-4 sm:p-5">
      {/*
        The key resets order-specific state when URL changes.

        This prevents previous AWB details,
        shipments and booking confirmation from
        carrying over to a different order.
      */}
      <IndiaPostDispatchPanel
        key={referenceFromUrl}
        orderId={legacyOrderId}
        orderReference={legacyOrderId ? undefined : referenceFromUrl}
        onBack={back}
      />
    </div>
  );
}
