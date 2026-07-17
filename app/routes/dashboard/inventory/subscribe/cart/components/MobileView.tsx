import { ImagePlus, Lock, Pencil, Trash2 } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppPopover from "~/components/core/popover/AppPopover";
import ImgRender from "~/components/core/img/ImgRender";
import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import UomPriceService from "~/services/UomPriceService";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import { useTranslation } from "react-i18next";
import { resolveB2cPrice } from "./B2cPriceConfig";

type Props = {
  data: any[];
  callback: (params: { action: string; data?: any }) => void;
};

const MobileView = ({ data, callback }: Props) => {
  const { t } = useTranslation();

  const handleAddMoreImages = (
    e: React.MouseEvent<HTMLButtonElement>,
    item: any,
  ) => {
    e.stopPropagation();
    callback({
      action: "add-more-images",
      data: { item: item },
    });
  };

  const handleEdit = (
    e: React.MouseEvent<HTMLButtonElement>,
    item: any,
    index: number,
  ) => {
    e.stopPropagation();
    callback({
      action: "edit",
      data: { ...item, index: index },
    });
  };

  const handleRemove = (
    e: React.MouseEvent<HTMLButtonElement>,
    item: any,
    index: number,
  ) => {
    e.stopPropagation();
    callback({
      action: "delete",
      data: { ...item, index: index },
    });
  };

  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:lg:grid-cols-4 tw:xl:grid-cols-6 tw:gap-3">
      {data.map((item, index) => {
        const displayName = item.isCloned
          ? item.dealName || item.name
          : item.name;
        const showNameInput = item.isCloned && !item.isConsumerOffer;
        const brandLabel = item.brand?.name || item.newBrand;
        const b2cConfig = item.b2cPriceConfig || {
          discount: 0,
          fixedPrice: 0,
          isFixedPrice: false,
        };
        const b2cPrice = resolveB2cPrice(b2cConfig, item.mrp);
        const b2cDiscount = Number(b2cConfig.discount) || 0;

        return (
          <div id={`subscribe-cart-row-${index}`} key={index}>
            <AppCard
              className={clsx(
                "tw:flex tw:flex-col tw:p-2.5 tw:mb-0 tw:relative tw:h-full tw:gap-2 tw:overflow-hidden",
                item.duplicateItemAnimate ? "duplicate-animate" : "",
                item.globalQtyAnimate ? "animate__animated animate__flash" : "",
              )}
              noContentPadding
            >
              {/* Top row: status chips + remove */}
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-1 tw:min-h-5">
                <div className="tw:flex tw:items-center tw:gap-1 tw:flex-wrap">
                  {item.isConsumerOffer && <ConsumerOfferBadge />}
                  {item.isCloned && (
                    <span className="tw:text-[10px] tw:font-medium tw:bg-blue-50 tw:text-blue-700 tw:border tw:border-blue-200 tw:px-1.5 tw:rounded">
                      Duplicate
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => handleRemove(e, item, index)}
                  className="tw:shrink-0 tw:text-gray-400 hover:tw:text-red-600 tw:transition-colors"
                  title="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Image with overlay action */}
              <div className="tw:flex tw:justify-center">
                <div className="tw:relative tw:group">
                  <button
                    type="button"
                    onClick={() =>
                      callback({
                        action: "show-img-preview",
                        data: { images: item.images },
                      })
                    }
                    className="tw:block tw:w-20 tw:h-20 tw:rounded-md tw:bg-gray-50 tw:border tw:border-gray-100 tw:overflow-hidden"
                  >
                    <ImgRender
                      assetId={
                        item.images && item.images.length > 0
                          ? item.images[0]
                          : undefined
                      }
                      alt={item.name}
                      className="tw:w-full tw:h-full tw:object-contain"
                    />
                  </button>
                  <button
                    onClick={(e) => handleAddMoreImages(e, item)}
                    title="Add more images"
                    className="tw:absolute tw:-bottom-1 tw:-right-1 tw:bg-white tw:border tw:border-gray-200 tw:shadow-sm tw:rounded-full tw:p-1 tw:text-blue-600 hover:tw:text-blue-700 hover:tw:border-blue-300 tw:transition"
                  >
                    <ImagePlus size={12} />
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="tw:min-h-9">
                {showNameInput ? (
                  <input
                    type="text"
                    className="tw:w-full tw:border tw:border-blue-400 tw:rounded-md tw:h-8 tw:px-2 tw:outline-none tw:text-[13px] tw:font-semibold tw:text-gray-900 tw:placeholder:tw:font-normal tw:placeholder:tw:text-gray-400 animate__animated animate__flash"
                    value={item.dealName || ""}
                    placeholder={t("enterDealName")}
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
                  <div
                    className="tw:text-[13px] tw:font-semibold tw:text-gray-900 tw:line-clamp-2 tw:leading-snug tw:tracking-tight"
                    title={displayName}
                  >
                    {displayName}
                  </div>
                )}
              </div>

              {/* Brand — reserve line even when empty so cards align */}
              <div className="tw:text-[11px] tw:text-gray-500 tw:truncate tw:min-h-4 tw:pb-1">
                {brandLabel || " "}
              </div>

              {/* Price block — consistent rows across cards */}
              <dl className="tw:flex tw:flex-col tw:gap-1 tw:text-xs tw:border-t tw:border-gray-100 tw:pt-2">
                <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
                  <dt className="tw:text-gray-500">{t("mrp")}</dt>
                  <dd className="tw:font-semibold tw:text-gray-900 tw:tabular-nums tw:flex tw:items-baseline tw:gap-1 tw:justify-end">
                    <DisplayPrice
                      price={item.mrp || 0}
                      uom={item.unitType}
                      className="tw:font-semibold tw:text-gray-900"
                      uomClassName="tw:text-[9px] tw:text-gray-500 tw:ml-0.5"
                    />
                    {UomPriceService.isSmallUom(item.unitType) && (
                      <span className="tw:text-[9px] tw:text-gray-400">
                        (<Amount
                          value={UomPriceService.toBaseUnitPrice(item.mrp)}
                          decimalPlaces={3}
                        />
                        /{item.unitType})
                      </span>
                    )}
                  </dd>
                </div>

                <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
                  <dt className="tw:text-gray-500">Pur. Price</dt>
                  <dd className="tw:font-semibold tw:text-gray-900 tw:tabular-nums tw:flex tw:items-baseline tw:gap-1 tw:justify-end">
                    <DisplayPrice
                      price={item.price || 0}
                      uom={item.unitType}
                      className="tw:font-semibold tw:text-gray-900"
                      uomClassName="tw:text-[9px] tw:text-gray-500 tw:ml-0.5"
                    />
                    {UomPriceService.isSmallUom(item.unitType) && (
                      <span className="tw:text-[9px] tw:text-gray-400">
                        (<Amount
                          value={UomPriceService.toBaseUnitPrice(item.price)}
                          decimalPlaces={3}
                        />
                        /{item.unitType})
                      </span>
                    )}
                  </dd>
                </div>

                <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
                  <dt className="tw:text-gray-500">{t("storeStock")}</dt>
                  <dd className="tw:font-semibold tw:text-gray-900 tw:tabular-nums">
                    {item.isCloned ? (
                      <AppPopover
                        triggerContent={
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="tw:inline-flex tw:items-center tw:gap-1 tw:px-2 tw:py-0.5 tw:rounded-md tw:border tw:border-dashed tw:border-gray-300 tw:bg-gray-50 tw:text-gray-400 tw:text-xs"
                          >
                            <Lock className="tw:w-3 tw:h-3" />
                          </button>
                        }
                      >
                        <div className="tw:text-xs tw:text-gray-700 tw:max-w-[220px]">
                          Quantity is locked for duplicate items.
                        </div>
                      </AppPopover>
                    ) : (
                      <>
                        {item.quantity || 0}{" "}
                        {UomPriceService.isSmallUom(item.unitType) && (
                          <span className="tw:text-[9px] tw:text-gray-500">
                            {UomPriceService.getDisplayUom(item.unitType)}
                          </span>
                        )}
                      </>
                    )}
                  </dd>
                </div>

                {/* B2C selling price — read-only; edited from the Edit modal.
                    Duplicate items carry no B2C config, but we still render the
                    row (with a placeholder) so card heights stay aligned. */}
                <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
                  <dt className="tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                    B2C Price
                    {!item.isCloned &&
                      (b2cConfig.isFixedPrice ? (
                        <span className="tw:text-[9px] tw:text-gray-400">
                          (Fixed)
                        </span>
                      ) : b2cDiscount > 0 ? (
                        <span className="tw:text-[9px] tw:text-green-600">
                          ({b2cDiscount}% off)
                        </span>
                      ) : null)}
                  </dt>
                  <dd className="tw:font-semibold tw:text-gray-900 tw:tabular-nums tw:flex tw:items-baseline tw:gap-1 tw:justify-end">
                    {item.isCloned ? (
                      <AppPopover
                        triggerContent={
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="tw:inline-flex tw:items-center tw:gap-1 tw:px-2 tw:py-0.5 tw:rounded-md tw:border tw:border-dashed tw:border-gray-300 tw:bg-gray-50 tw:text-gray-400 tw:text-xs"
                          >
                            <Lock className="tw:w-3 tw:h-3" />
                          </button>
                        }
                      >
                        <div className="tw:text-xs tw:text-gray-700 tw:max-w-[220px]">
                          B2C price is locked for duplicate items.
                        </div>
                      </AppPopover>
                    ) : (
                      <>
                        <DisplayPrice
                          price={b2cPrice || 0}
                          uom={item.unitType}
                          className="tw:font-semibold tw:text-gray-900"
                          uomClassName="tw:text-[9px] tw:text-gray-500 tw:ml-0.5"
                        />
                        {UomPriceService.isSmallUom(item.unitType) && (
                          <span className="tw:text-[9px] tw:text-gray-400">
                            (<Amount
                              value={UomPriceService.toBaseUnitPrice(b2cPrice)}
                              decimalPlaces={3}
                            />
                            /{item.unitType})
                          </span>
                        )}
                      </>
                    )}
                  </dd>
                </div>
              </dl>

              {/* Footer */}
              <div className="tw:mt-auto tw:pt-1">
                <AppButton
                  fill="outline"
                  size="small"
                  color="primary"
                  className="tw:w-full"
                  onClick={(e) => handleEdit(e, item, index)}
                >
                  <Pencil className="tw:w-3 tw:h-3" />
                  {t("edit")}
                </AppButton>
              </div>
            </AppCard>
          </div>
        );
      })}
    </div>
  );
};

export default MobileView;
