import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { FiAlertCircle, FiArrowLeft, FiRefreshCw } from "react-icons/fi";

export default function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  let title = "Something went wrong";
  let message = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message =
      (error.data as any)?.message ||
      error.data?.toString?.() ||
      "The page could not be loaded.";
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F8FD] p-6">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <FiAlertCircle size={26} />
        </div>
        <h2 className="text-lg font-bold text-[#111827]">{title}</h2>
        <p className="mt-2 break-words text-sm text-[#6B7280]">{message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl border border-[#2D6FE8]/20 bg-white px-4 py-2 text-sm font-semibold text-[#2D6FE8] hover:bg-[#EAF3FF]"
          >
            <FiArrowLeft size={14} /> Go back
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-xl bg-[#2D6FE8] px-4 py-2 text-sm font-semibold text-white"
          >
            <FiRefreshCw size={14} /> Reload
          </button>
        </div>
      </div>
    </div>
  );
}