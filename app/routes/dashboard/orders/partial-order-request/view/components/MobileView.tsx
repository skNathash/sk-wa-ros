import React from "react";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import Amount from "~/components/core/amount/Amount";
import { Hash } from "lucide-react";

interface MobileViewProps {
  items: any[];
}

const statLabel =
  "tw:block tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-slate-500 tw:font-semibold tw:mb-0.5";

const MobileView: React.FC<MobileViewProps> = ({ items }) => {
  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      {items.map((item, index) => {
        const mrp = Number(item.mrp);
        const unitPrice = Number(item.price);
        const showMrpStrike =
          Number.isFinite(mrp) &&
          Number.isFinite(unitPrice) &&
          mrp > unitPrice;

        return (
        <AppCard
          key={item._id || index}
          noContentPadding
          className="tw:overflow-hidden"
        >
          <div className="tw:flex tw:gap-3 tw:p-3">
            <ImgRender
              assetId={item.images?.[0]}
              className="tw:w-16 tw:h-16 tw:rounded-lg tw:border tw:border-slate-200 tw:object-cover tw:bg-white tw:shrink-0"
            />
            <div className="tw:flex-1 tw:min-w-0 tw:flex tw:flex-col tw:gap-2">
              <div>
                <h4 className="tw:text-sm tw:font-bold tw:text-slate-900 tw:line-clamp-2 tw:leading-snug tw:mb-1">
                  {item.dealName}
                </h4>
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-slate-600 tw:font-medium">
                  <Hash size={12} className="tw:text-slate-500" />
                  {item.dealRefId || "N/A"}
                </div>
              </div>

              <div className="tw:rounded-lg tw:bg-slate-50 tw:border tw:border-slate-100 tw:p-2.5 tw:space-y-2.5">
                <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                  <div>
                    <span className={statLabel}>MRP</span>
                    <Amount
                      value={item.mrp}
                      className={
                        showMrpStrike
                          ? "tw:text-sm tw:tabular-nums tw:text-slate-400 tw:line-through tw:decoration-slate-400"
                          : "tw:text-sm tw:tabular-nums tw:font-semibold tw:text-slate-800"
                      }
                    />
                  </div>
                  <div className="tw:text-right">
                    <span className={statLabel}>Unit price</span>
                    <Amount
                      value={item.price}
                      className="tw:text-sm tw:tabular-nums tw:font-bold tw:text-slate-900"
                    />
                  </div>
                </div>
                <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:pt-2 tw:border-t tw:border-slate-200/80">
                  <div>
                    <span className={statLabel}>Requested qty</span>
                    <span className="tw:text-sm tw:tabular-nums tw:font-bold tw:text-slate-900">
                      {item.quantity ?? "—"}
                    </span>
                  </div>
                  <div className="tw:text-right">
                    <span className={statLabel}>Ordered qty</span>
                    <span className="tw:text-sm tw:tabular-nums tw:font-semibold tw:text-slate-800">
                      {item.actualOrderQty !== undefined &&
                      item.actualOrderQty !== null
                        ? item.actualOrderQty
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:pt-2 tw:border-t tw:border-slate-200/80">
                  <span className="tw:text-xs tw:font-semibold tw:text-slate-600">
                    Line total
                  </span>
                  <Amount
                    value={item.finalPrice}
                    className="tw:text-base tw:tabular-nums tw:font-bold tw:text-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </AppCard>
        );
      })}

      <AppCard className="tw:bg-slate-50 tw:border-dashed">
        <div className="tw:flex tw:justify-between tw:items-center">
          <span className="tw:text-xs tw:font-semibold tw:text-slate-700">
            Total Items
          </span>
          <span className="tw:text-sm tw:font-bold tw:text-slate-900">
            {items.length}
          </span>
        </div>
        <div className="tw:flex tw:justify-between tw:items-center tw:mt-2 tw:pt-2 tw:border-t tw:border-slate-200">
          <span className="tw:text-sm tw:font-semibold tw:text-slate-900">
            Total Amount
          </span>
          <Amount
            value={items.reduce((acc, curr) => acc + (curr.finalPrice || 0), 0)}
            className="tw:text-base tw:font-bold tw:text-primary"
          />
        </div>
      </AppCard>
    </div>
  );
};

export default MobileView;
