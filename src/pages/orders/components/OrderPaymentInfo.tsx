import React from "react";
import {
  FiCreditCard,
  FiDownload,
} from "react-icons/fi";

const OrderPaymentInfo: React.FC = () => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiCreditCard
            size={18}
            className="text-[#304b6b]"
          />

          <h3 className="font-lato text-[14px] font-bold tracking-[0.5px] text-[#30445d]">
            PAYMENT INFO
          </h3>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 font-arimo text-[14px] text-[#071a35] hover:underline"
        >
          <FiDownload size={15} />
          Invoice
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="font-arimo text-[15px] text-[#30445d]">
            Method:
          </span>

          <span className="font-lato text-[15px] font-bold text-[#071a35]">
            Wire Transfer
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="font-arimo text-[15px] text-[#30445d]">
            Transaction ID:
          </span>

          <span className="font-arimo text-[13px] text-[#17395f]">
            WT-893049281A
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderPaymentInfo;