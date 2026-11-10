import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiAlertCircle, FiLoader } from "react-icons/fi";

import { orderApi } from "../../api/endpoints/orders";
import IndiaPostDispatchPanel from "./IndiaPostDispatchPanel";


export default function IndiaPostDispatchPage() {
  const { orderReference } = useParams<{ orderReference: string }>();
  const navigate = useNavigate();

  const [resolvedId, setResolvedId] = useState<number | null>(null);
  const [resolvedRef, setResolvedRef] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const back = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // If the param is already numeric, use it directly.
  useEffect(() => {
    if (!orderReference) {
      setError("Missing order reference in URL.");
      setLoading(false);
      return;
    }

    const asNumber = Number(orderReference);
    if (Number.isSafeInteger(asNumber) && asNumber > 0) {
      setResolvedId(asNumber);
      setResolvedRef(orderReference);
      setLoading(false);
      return;
    }

    // Otherwise it's an order_reference string — resolve to numeric id.
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await orderApi.getOrderDetails(orderReference);
        const body: any = response?.data?.data ?? response?.data ?? {};
        const id = Number(body?.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
          throw new Error("Order not found or invalid id.");
        }
        if (!cancelled) {
          setResolvedId(id);
          setResolvedRef(body?.order_reference || orderReference);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to resolve order reference.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderReference]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#DCE6F2] bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center">
            <FiLoader size={28} className="animate-spin text-[#2D6FE8]" />
            <p className="mt-3 text-sm font-semibold text-[#111827]">
              Loading order…
            </p>
          </div>
        </div>
      );
    }

    if (error || !resolvedId) {
      return (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8">
          <div className="flex flex-col items-center text-center">
            <FiAlertCircle size={28} className="text-red-600" />
            <p className="mt-3 text-sm font-semibold text-red-800">
              {error || "Unable to load order."}
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
      );
    }

    return (
      <IndiaPostDispatchPanel
        orderId={resolvedId}
        orderReference={resolvedRef}
        onBack={back}
      />
    );
  }, [loading, error, resolvedId, resolvedRef, back]);

  return <div className="min-h-screen bg-[#F4F8FD] p-4 sm:p-5">{content}</div>;
}