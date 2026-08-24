import { Boxes, Coins, Share2, Tag } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import TintTile from "~/components/core/tint/TintTile";
import { tintIndexFor } from "~/components/core/tint/tints";
import { TIER_LABEL, shareDeal, type SectionDeal } from "./helper";

type Props = {
  show: boolean;
  deal: SectionDeal | null;
  callback: (params: { action: string; data?: any }) => void;
};

const DealDetailModal = ({ show, deal, callback }: Props) => {
  const handleClose = () => callback({ action: "close" });

  return (
    <AppModal show={show} callback={callback} className="tw:md:max-w-md">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:min-w-0">
          <h2 className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400">
            Coin Store reward
          </h2>
          <p className="tw:text-sm tw:font-bold tw:leading-tight tw:text-gray-900 tw:line-clamp-2">
            {deal?.name}
          </p>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        {deal ? (
          <div className="tw:flex tw:flex-col tw:gap-3">
            <TintTile
              index={tintIndexFor(deal.name)}
              className="tw:h-36 tw:rounded-xl tw:px-4"
            >
              {deal.image ? (
                <ImgRender
                  assetId={deal.image}
                  size="600x600"
                  alt={deal.name}
                  className="tw:max-h-full tw:w-auto tw:object-contain"
                />
              ) : (
                <span className="tw:text-center tw:text-sm tw:font-semibold tw:uppercase tw:tracking-[0.15em]">
                  {deal.name}
                </span>
              )}
            </TintTile>

            <div className="tw:grid tw:grid-cols-3 tw:gap-2">
              <div className="tw:rounded-lg tw:border tw:border-amber-100 tw:bg-amber-50 tw:px-2.5 tw:py-2">
                <div className="tw:mb-1 tw:flex tw:items-center tw:gap-1">
                  <Coins className="tw:h-3 tw:w-3 tw:text-amber-600" />
                  <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-amber-700">
                    Coins
                  </span>
                </div>
                <div className="tw:text-sm tw:font-bold tw:text-amber-700">
                  {deal.coins.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="tw:rounded-lg tw:border tw:border-gray-100 tw:bg-gray-50 tw:px-2.5 tw:py-2">
                <div className="tw:mb-1 tw:flex tw:items-center tw:gap-1">
                  <Tag className="tw:h-3 tw:w-3 tw:text-gray-400" />
                  <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-500">
                    MRP
                  </span>
                </div>
                <Amount
                  value={deal.mrp}
                  className="tw:text-sm tw:font-bold tw:text-gray-800"
                />
              </div>

              <div className="tw:rounded-lg tw:border tw:border-emerald-100 tw:bg-emerald-50 tw:px-2.5 tw:py-2">
                <div className="tw:mb-1 tw:flex tw:items-center tw:gap-1">
                  <Boxes className="tw:h-3 tw:w-3 tw:text-emerald-600" />
                  <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-emerald-700">
                    Ready
                  </span>
                </div>
                <div className="tw:text-sm tw:font-bold tw:text-emerald-700">
                  {deal.stock}
                </div>
              </div>
            </div>

            <dl className="tw:divide-y tw:divide-gray-100 tw:rounded-lg tw:border tw:border-gray-100">
              {[
                { label: "Tier", value: TIER_LABEL[deal.tier] },
                { label: "Category", value: deal.category || "—" },
                { label: "Brand", value: deal.brand || "—" },
                {
                  label: "Customer can redeem",
                  value: deal.canBuy ? "Yes" : "Not yet",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-3 tw:py-2"
                >
                  <dt className="tw:text-[11px] tw:text-gray-500">
                    {row.label}
                  </dt>
                  <dd className="tw:truncate tw:text-[12px] tw:font-semibold tw:text-gray-800">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <AppButton
              color="primary"
              onClick={() => shareDeal(deal)}
              className="tw:w-full"
            >
              <span className="tw:flex tw:items-center tw:justify-center tw:gap-1.5">
                <Share2 className="tw:h-4 tw:w-4" />
                Share with customers
              </span>
            </AppButton>
          </div>
        ) : null}
      </AppModal.Content>
    </AppModal>
  );
};

export default DealDetailModal;
