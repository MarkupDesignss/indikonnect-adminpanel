import React from "react";
import { FiClock } from "react-icons/fi";

interface TimelineItem {
  title: string;
  description: string;
  active: boolean;
}

const timeline: TimelineItem[] = [
  {
    title: "Awaiting Fulfillment",
    description: "Pending action",
    active: false,
  },
  {
    title: "Payment Confirmed",
    description:
      "Oct 24, 11:15 AM - Wire Transfer",
    active: true,
  },
  {
    title: "Order Placed",
    description:
      "Oct 24, 10:42 AM - via Wholesale Portal",
    active: true,
  },
];

const OrderTimeline: React.FC = () => {
  return (
    <div className="rounded-[4px] border border-[#d8e0e9] bg-white p-6">
      <div className="flex items-center gap-3">
        <FiClock
          size={18}
          className="text-[#304b6b]"
        />

        <h3 className="font-lato text-[14px] font-bold tracking-[0.5px] text-[#30445d]">
          TIMELINE
        </h3>
      </div>

      <div className="mt-6">
        {timeline.map(
          (item, index) => (
            <div
              key={item.title}
              className="relative flex gap-4"
            >
              {/* LINE */}

              {index !==
                timeline.length - 1 && (
                <div className="absolute left-[6px] top-[17px] h-[55px] w-[1px] bg-[#cbd5e1]" />
              )}

              {/* DOT */}

              <div className="relative z-10 pt-[2px]">
                <div
                  className={`h-[13px] w-[13px] rounded-full border-2 ${
                    item.active
                      ? "border-[#10b981] bg-[#10b981]"
                      : "border-[#cbd5e1] bg-white"
                  }`}
                />
              </div>

              <div className="pb-6">
                <p className="font-lato text-[16px] font-bold text-[#071a35]">
                  {item.title}
                </p>

                <p className="mt-1 font-arimo text-[13px] text-[#304b6b]">
                  {item.description}
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default OrderTimeline;