import React from "react";
import AppButton from "~/components/core/button/AppButton";
import AppBadge from "~/components/core/badge/AppBadge";
import { Edit, Eye } from "lucide-react";

type Slab = {
  minQuantity?: number;
  maxQuantity?: number;
  discountPercentage?: string | number;
  isActive?: boolean;
};

type Props = {
  slabs?: Slab[];
  isActive?: boolean;
};

type CallbackPayload = { action: string; data?: any };

type PropsWithCallback = Props & {
  callback: (payload: CallbackPayload) => void;
};

type PropsWithId = PropsWithCallback & { id?: string };

export default function DefaultSlabs({
  slabs = [],
  callback,
  id,
  isActive,
}: PropsWithId) {
  const configured = Array.isArray(slabs) && slabs.length > 0;
  return (
    <div className="tw:mb-4">
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
        <div className="tw:flex tw:items-center tw:gap-3">
          <h4 className="tw:text-sm tw:font-semibold">Default slabs</h4>
          {configured && (
            <AppBadge
              variant={isActive ? "success" : "danger"}
              className="tw:text-xs tw:font-semibold"
            >
              {isActive ? "Active" : "Inactive"}
            </AppBadge>
          )}
        </div>
        {configured && (
          <div className="tw:flex tw:gap-2">
            <AppButton
              size="small"
              onClick={() =>
                callback({ action: "edit", data: id ? { _id: id } : undefined })
              }
            >
              <Edit className="tw:w-4 tw:h-4" />
              Edit
            </AppButton>

            {/* logs */}
            <AppButton
              size="small"
              onClick={() =>
                callback({ action: "logs", data: id ? { _id: id } : undefined })
              }
              color="light"
              fill="outline"
            >
              <Eye className="tw:w-4 tw:h-4" />
              View Logs
            </AppButton>
          </div>
        )}
      </div>
      {configured && (
        <div className="tw:bg-white tw:border tw:border-slate-200 tw:rounded-xl tw:shadow-sm tw:overflow-hidden">
          <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:bg-slate-50 tw:px-4 tw:py-3 tw:text-[10px] tw:uppercase tw:tracking-wider tw:font-bold tw:text-slate-500 tw:border-b tw:border-slate-200">
            <div>Min Quantity</div>
            <div>Max Quantity</div>
            <div className="tw:text-right">Discount</div>
          </div>

          <div className="tw:divide-y tw:divide-slate-100">
            {slabs.map((s, idx) => (
              <div
                key={idx}
                className="tw:grid tw:grid-cols-3 tw:gap-4 tw:px-4 tw:py-3 tw:items-center hover:tw:bg-slate-50/50 tw:transition-colors"
              >
                <div className="tw:text-sm tw:font-medium tw:text-slate-700">
                  {s.minQuantity ?? "0"}
                </div>
                <div className="tw:text-sm tw:font-medium tw:text-slate-700">
                  {s.maxQuantity ?? "-"}
                </div>
                <div className="tw:text-right">
                  <span className="tw:inline-flex tw:items-center tw:px-2.5 tw:py-0.5 tw:rounded-full tw:text-xs tw:font-bold tw:bg-blue-100 tw:text-blue-700">
                    {s.discountPercentage}% OFF
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
