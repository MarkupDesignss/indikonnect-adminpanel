import React from "react";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiTruck,
} from "react-icons/fi";

const OrderCustomerDetails: React.FC = () => {
  return (
    <div className="rounded-[4px] border border-[#d8e0e9] bg-white p-6">
      {/* CUSTOMER */}

      <div className="flex items-center gap-3">
        <FiUser
          size={18}
          className="text-[#304b6b]"
        />

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

        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-2 font-arimo text-[14px] text-[#17395f]">
            <FiMail size={15} />
            jane.doe@acmecorp.com
          </p>

          <p className="flex items-center gap-2 font-arimo text-[14px] text-[#17395f]">
            <FiPhone size={15} />
            (555) 123-4567
          </p>
        </div>
      </div>

      <div className="my-5 border-t border-[#dce2e9]" />

      {/* SHIPPING */}

      <div className="flex items-center gap-3">
        <FiTruck
          size={18}
          className="text-[#304b6b]"
        />

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