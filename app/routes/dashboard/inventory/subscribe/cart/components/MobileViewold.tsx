import { Copy, Info, Trash2, Pencil, Percent } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import { AppSelect } from "~/components/core/form";
import AppPopover from "~/components/core/popover/AppPopover";
import Amount from "~/components/core/amount/Amount";
import clsx from "clsx";
import ChooseBarcode from "./ChooseBarcode";
import AuthService from "~/services/AuthService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";

type Props = {
  data: any[];
  callback: (params: { action: string; data?: any }) => void;
};

const uoms = InventorySubscribeService.getUomOptions();

const MobileView = ({ data, callback }: Props) => {
  const handleEnableOfferClick = (item: any, index: number) => {
    callback({
      action: "enableOffer",
      data: {
        dealName: item.dealName || item.name,
        dealId: item._id,
        mrp: item.mrp,
        b2cPrice: item.price,
        index: index,
      },
    });
  };

  const isMasterLogin = AuthService.isMasterLogin();

  const handleAddMoreImages = (
    e: React.MouseEvent<HTMLButtonElement>,
    item: any
  ) => {
    e.stopPropagation();
    callback({
      action: "add-more-images",
      data: { item: item },
    });
  };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item, index) => (
        <AppCard
          key={index}
          className={clsx(
            item.duplicateItemAnimate ? "duplicate-animate" : "",
            item.globalQtyAnimate ? "animate__animated animate__flash" : ""
          )}
        >
          <div
            className={clsx("tw:flex tw:gap-2 tw:items-start tw:mb-2 ")}
            id={`subscribe-cart-row-${index}`}
          >
            <div
              onClick={() =>
                callback({
                  action: "show-img-preview",
                  data: { images: item.images },
                })
              }
              className="tw:cursor-pointer tw:relative"
            >
              <ImgRender
                assetId={
                  item.images && item.images.length > 0
                    ? item.images[0]
                    : undefined
                }
                alt={item.name}
                className="tw:w-14 tw:h-14 tw:object-contain tw:rounded-md tw:bg-gray-100 tw:border tw:border-gray-200"
              />
              {item.isCloned && (
                <div className="tw:absolute tw:-left-1 tw:-top-3">
                  <span className="tw:text-[10px] tw:bg-blue-600/80 tw:text-white tw:px-2 tw:py-0.5 tw:rounded-md">
                    Cloned
                  </span>
                </div>
              )}
              <div className="tw:mt-1">
                <button
                  className="tw:text-[10px] tw:text-blue-500 tw:cursor-pointer tw:underline tw:inline-block"
                  onClick={(e) => handleAddMoreImages(e, item)}
                >
                  Add More Images
                </button>
              </div>
            </div>
            <div className="tw:flex-1">
              <div className="tw:flex tw:justify-between tw:items-start tw:mb-2">
                <div className="tw:flex-1">
                  {item.isCloned ? (
                    // For cloned items, show editable deal name only when it's not a consumer offer
                    !item.isConsumerOffer ? (
                      <input
                        type="text"
                        className="tw:w-full tw:border tw:border-gray-300 tw:rounded-md tw:h-8 tw:p-2 tw:outline-none tw:font-semibold tw:md:h-7 tw:md:p-1.5 tw:md:text-xs"
                        value={item.dealName || ""}
                        placeholder="Enter deal name"
                        onChange={(e) => {
                          callback({
                            action: "fieldUpdate",
                            data: {
                              value: e.target.value,
                              index: index,
                              key: "dealName",
                            },
                          });
                        }}
                      />
                    ) : (
                      // If it's a consumer offer, show plain text (do not show input)
                      <div
                        className="tw:font-semibold"
                        title={item.dealName || item.name}
                      >
                        {item.dealName || item.name}
                      </div>
                    )
                  ) : (
                    <div className="tw:font-semibold" title={item.name}>
                      {item.name}
                    </div>
                  )}
                </div>
              </div>
              <div className="tw:flex tw:gap-2 tw:mb-1 tw:flex-wrap">
                <AppBadge variant="light">{item.category?.name}</AppBadge>
                {item.isConsumerOffer && <ConsumerOfferBadge />}
              </div>
              {/* MRP moved to the grid below */}

              <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap tw:mb-1">
                {!item.isCloned && (
                  <div className="tw:text-xs tw:text-slate-900">
                    ID: {item.dealRefId}
                  </div>
                )}
                <div className="tw:text-xs tw:text-slate-900">
                  HSN: {item.hsn || "--"}
                </div>
                <div className="tw:text-xs tw:text-slate-900">
                  GST: {item.gst}%
                </div>
              </div>
            </div>

            {/* removed top action buttons per design; actions moved to bottom of card */}
          </div>

          <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:mt-2">
            <div>
              <label className="tw:text-sm tw:text-gray-500 tw:mb-1 tw:md:text-xs">
                MRP
              </label>
              <input
                type="number"
                className="tw:w-full tw:border tw:border-gray-300 tw:rounded-md tw:h-10 tw:p-2 tw:outline-none tw:md:h-8 tw:md:p-1.5 tw:md:text-xs"
                value={item.mrp}
                onChange={(e) => {
                  callback({
                    action: "fieldUpdate",
                    data: {
                      value: e.target.value,
                      index: index,
                      key: "mrp",
                    },
                  });
                }}
                placeholder="MRP"
              />
            </div>

            <div>
              <label className="tw:text-sm tw:text-gray-500 tw:mb-1 tw:md:text-xs">
                Purchase Price
              </label>
              <input
                type="number"
                className={clsx(
                  "tw:w-full tw:border-gray-300 tw:rounded-md tw:h-10 tw:p-2 tw:outline-none tw:md:h-8 tw:md:p-1.5 tw:md:text-xs",
                  {
                    "tw:border": !isMasterLogin,
                  }
                )}
                value={item.price}
                onChange={(e) => {
                  callback({
                    action: "fieldUpdate",
                    data: {
                      value: e.target.value,
                      index: index,
                      key: "price",
                    },
                  });
                }}
                disabled={isMasterLogin}
                readOnly={isMasterLogin}
              />
            </div>

            <div>
              <label className="tw:text-sm tw:text-gray-500 tw:mb-1 tw:md:text-xs">
                Store Stock
              </label>
              <input
                type="number"
                className={clsx(
                  "tw:w-full tw:border-gray-300 tw:rounded-md tw:h-10 tw:p-2 tw:outline-none tw:md:h-8 tw:md:p-1.5 tw:md:text-xs",
                  {
                    "tw:border": !isMasterLogin,
                  }
                )}
                value={item.quantity}
                onChange={(e) => {
                  callback({
                    action: "fieldUpdate",
                    data: {
                      value: e.target.value,
                      index: index,
                      key: "quantity",
                    },
                  });
                }}
                disabled={isMasterLogin}
                readOnly={isMasterLogin}
              />
            </div>

            <div>
              <label className="tw:text-sm tw:text-gray-500 tw:mb-1 tw:flex tw:items-center tw:gap-1 tw:md:text-xs">
                UOM{" "}
                <AppPopover triggerContent={<Info className="tw:w-4 tw:h-4" />}>
                  <div className="tw:text-sm tw:text-gray-500">
                    UOM is the unit of measure for the product.
                  </div>
                </AppPopover>
              </label>
              <AppSelect
                options={uoms}
                placeholder="Select UOM"
                value={item.unitType}
                onChange={(val) => {
                  callback({
                    action: "fieldUpdate",
                    data: {
                      value: val,
                      index: index,
                      key: "unitType",
                    },
                  });
                }}
                inputClassName="tw:w-full tw:h-10 tw:md:h-8 tw:md:text-xs"
              />
            </div>

            <div className="tw:col-span-2">
              <label className="tw:text-sm tw:text-gray-500 tw:mb-1 tw:md:text-xs">
                Barcode
              </label>
              <ChooseBarcode
                barcode={item.barcode}
                barcodeOptions={item.barcodeOptions}
                showbarcodeOption={item.showbarcodeOption}
                dealId={
                  item.isCloned
                    ? undefined
                    : item.dealId || item._id
                }
                uom={item.unitType}
                callback={(params) => {
                  if (params.action === "fieldUpdate") {
                    callback({
                      action: "fieldUpdate",
                      data: {
                        value: params.data?.value,
                        index,
                        key: "barcode",
                      },
                    });
                  } else {
                    callback({ action: params.action, data: { index } });
                  }
                }}
              />
            </div>
          </div>

          {/* Actions at bottom: total value and action buttons */}
          <div className="tw:flex tw:flex-col tw:mt-10">
            <div className="tw:flex tw:flex-row tw:justify-between">
              <div className="tw:text-sm tw:text-gray-500">Total Value</div>
              <div className="tw:text-lg tw:font-bold">
                <Amount value={item.totalPrice} decimalPlaces={2} />
              </div>
            </div>

            <div className="tw:flex tw:gap-x-2 tw:flex-wrap">
              {!item.isCloned && (
                <AppButton
                  fill="outline"
                  size="small"
                  onClick={() => {
                    callback({
                      action: "clone",
                      data: { ...item, index: index },
                    });
                  }}
                  color="primary"
                >
                  <Copy />
                  Clone
                </AppButton>
              )}

              {/* Offer button for non-cloned items (opens consumer offer modal)
                  Hide for cloned items and for items that are already consumer offers */}
              {!item.isCloned && !item.isConsumerOffer && (
                <AppButton
                  size="small"
                  color="success"
                  onClick={() => handleEnableOfferClick(item, index)}
                >
                  <Percent />
                  Offer
                </AppButton>
              )}

              <AppButton
                fill="outline"
                size="small"
                color="danger"
                onClick={() => {
                  callback({ action: "delete", data: { ...item, index } });
                }}
              >
                <Trash2 />
                Remove
              </AppButton>
            </div>
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default MobileView;
