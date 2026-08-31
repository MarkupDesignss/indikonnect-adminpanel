import React from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiTruck,
} from "react-icons/fi";

const OrderCustomerDetails: React.FC = () => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* CUSTOMER DETAILS */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#eef3f8]">
          <FiUser size={17} className="text-[#304b6b]" />
        </div>

        <h3 className="font-lato text-[14px] font-bold tracking-[0.5px] text-[#30445d]">
          CUSTOMER DETAILS
        </h3>
      </div>

      <div className="mt-5">
        <p className="font-lato text-[16px] font-bold text-[#071a35]">
          Acme Corp
        </p>

        <p className="mt-1 font-arimo text-[15px] text-[#071a35]">
          Jane Doe
        </p>

        <div className="mt-4 space-y-3">
          <p className="flex items-center gap-2.5 font-arimo text-[14px] text-[#17395f]">
            <FiMail size={15} className="shrink-0 text-[#5d7693]" />
            <span>jane.doe@acmecorp.com</span>
          </p>

          <p className="flex items-center gap-2.5 font-arimo text-[14px] text-[#17395f]">
            <FiPhone size={15} className="shrink-0 text-[#5d7693]" />
            <span>(555) 123-4567</span>
          </p>
        </div>
      </div>

      <div className="my-5 border-t border-[#dce2e9]" />

      {/* SHIPPING ADDRESS */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#eef3f8]">
          <FiTruck size={17} className="text-[#304b6b]" />
        </div>

        <h3 className="font-lato text-[14px] font-bold tracking-[0.5px] text-[#30445d]">
          SHIPPING ADDRESS
        </h3>
      </div>

      <div className="mt-4 space-y-1 font-arimo text-[15px] leading-[1.6] text-[#071a35]">
        <p>123 Industrial Parkway</p>
        <p>Building B, Suite 200</p>
        <p>San Jose, CA 95134</p>
        <p>United States</p>
      </div>
    </div>
  );
};

export default OrderCustomerDetails;