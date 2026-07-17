import Amount from "app/components/core/amount/Amount";
import AppBadge from "app/components/core/badge/AppBadge";
import AppButton from "app/components/core/button/AppButton";
import ImgRender from "app/components/core/img/ImgRender";
import AppTable from "app/components/core/table/AppTable";
import TableHeader from "app/components/core/table/TableHeader";
import clsx from "clsx";
import { Copy, Lock, Plus, Trash2 } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import AppPopover from "~/components/core/popover/AppPopover";
import AuthService from "~/services/AuthService";
import UomPriceService from "~/services/UomPriceService";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import type { TableHeaderItem } from "~/types/CommonTypes";
import B2cPriceConfig from "./B2cPriceConfig";
import type { B2cPriceConfigValue } from "./B2cPriceConfig";
import ChooseBarcode from "./ChooseBarcode";

interface Props {
  data: any[];
  callback: (params: { action: string; data?: any }) => void;
  unitOptions?: { label: string; value: string }[];
}

const headers: TableHeaderItem[] = [
  { label: "Image", key: "image", width: "6%", langKey: "image" },
  {
    label: "Item Detail",
    key: "productDetail",
    width: "17%",
    langKey: "productDetail",
  },
  {
    label: "UOM",
    key: "unitType",
    width: "7%",
    langKey: "unitType",
    info: (
      <div className="tw:text-xs tw:text-gray-500">
        UOM is the unit of measure for the product.
      </div>
    ),
  },
  { label: "MRP", key: "mrp", width: "8%", langKey: "mrp" },
  {
    label: "Purchase Price",
    key: "yourPrice",
    width: "9%",
    langKey: "purchasePrice",
  },
  {
    label: "B2C Price",
    key: "b2cPrice",
    width: "13%",
    info: (
      <div className="tw:text-xs tw:text-gray-500">
        The consumer selling price. Set a fixed price or a discount off MRP.
      </div>
    ),
  },
  { label: "Store Stock", key: "quantity", width: "7%", langKey: "quantity" },
  { label: "Barcode", key: "barcode", width: "12%", langKey: "barcode" },
  {
    label: "Total Value",
    key: "totalValue",
    width: "7%",
    langKey: "totalValue",
  },
  { label: "Actions", key: "actions", width: "11%", langKey: "actions" },
];

const DesktopView: React.FC<Props> = ({ data, callback, unitOptions }) => {
  const { t } = useTranslation(["common"]);

  const handleBarcodeChange = (
    params: { action: string; data?: any },
    index: number,
  ) => {
    if (params.action === "markAsLocal") {
      callback({
        action: "markAsLocal",
        data: { ...params.data, index },
      });
      return;
    }
    callback({
      action: params.action,
      data: { value: params.data?.value, index, key: "barcode" },
    });
  };

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

  const handleB2cPriceConfigChange = (
    config: B2cPriceConfigValue,
    index: number,
  ) => {
    callback({
      action: "b2cPriceConfigUpdate",
      data: { value: config, index },
    });
  };

  const isMasterLogin = AuthService.isMasterLogin();

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

  return (
    <AppCard noPadding>
      <AppTable fixedLayout container size="sm" stickyHeader condensed>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {data.map((item, index) => (
            <AppTable.Row
              key={index}
              id={`subscribe-cart-row-${index}`}
              className={clsx(
                item.duplicateItemAnimate ? "duplicate-animate" : "",
                item.globalQtyAnimate ? "animate__animated animate__flash" : "",
              )}
            >
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:items-start tw:gap-1">
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
                      key={`${item.itemId}-${item.images?.[0] || "no-image"}-${
                        item.images?.length || 0
                      }`}
                      assetId={
                        item.images && item.images.length > 0
                          ? item.images[0]
                          : undefined
                      }
                      alt={item.name}
                      className="tw:w-14 tw:h-14 tw:object-contain tw:rounded-md tw:bg-gray-100 tw:border tw:border-gray-200"
                    />
                    {item.isCloned && (
                      <span className="tw:absolute tw:-top-1 tw:-left-1 tw:text-[10px] tw:font-medium tw:bg-blue-600/90 tw:text-white tw:px-1.5 tw:py-0.5 tw:rounded">
                        Duplicate
                      </span>
                    )}
                  </div>
                  <button
                    className="tw:text-[10px] tw:text-blue-600 tw:underline"
                    onClick={(e) => handleAddMoreImages(e, item)}
                  >
                    Add More Images
                  </button>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:gap-1">
                  {item.isCloned ? (
                    !item.isConsumerOffer ? (
                      <input
                        type="text"
                        className="tw:w-full tw:border tw:border-blue-500 tw:rounded-md tw:h-8 tw:px-2 tw:outline-none tw:text-sm animate__animated animate__flash"
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
                        className="tw:font-medium tw:text-sm tw:text-gray-900"
                        title={item.dealName || item.name}
                      >
                        {item.dealName || item.name}
                      </div>
                    )
                  ) : (
                    <div
                      className="tw:font-medium tw:text-sm tw:text-gray-900"
                      title={item.name}
                    >
                      {item.name}
                    </div>
                  )}

                  {!item.isCloned && (
                    <div className="tw:text-xs tw:text-gray-500">
                      ID: {item.dealRefId}
                    </div>
                  )}

                  <div className="tw:flex tw:items-center tw:gap-x-3 tw:gap-y-0.5 tw:flex-wrap tw:text-xs tw:text-slate-700">
                    <span>
                      {t("hsn")}: {item.hsnNumber || "--"}
                    </span>
                    <span>
                      {t("gst")}: {item.gst}%
                    </span>
                    {item.brand?.name && (
                      <span className="tw:text-gray-500">
                        {item.brand?.name}
                      </span>
                    )}
                  </div>

                  {(item.category?.name ||
                    item.isConsumerOffer ||
                    item.isCloned ||
                    item.isLocalDeal) && (
                    <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                      {item.category?.name && (
                        <AppBadge variant="light">
                          {item.category?.name}
                        </AppBadge>
                      )}
                      {item.isLocalDeal && (
                        <span className="tw:text-[10px] tw:font-medium tw:bg-emerald-600/90 tw:text-white tw:px-1.5 tw:py-0.5 tw:rounded">
                          Local
                        </span>
                      )}
                      {item.isConsumerOffer && <ConsumerOfferBadge />}
                      {item.isCloned && (
                        <button
                          type="button"
                          className="tw:text-blue-600 tw:underline tw:text-xs"
                          onClick={() => {
                            callback({
                              action: "edit",
                              data: { ...item, index },
                            });
                          }}
                        >
                          {t("addMoreDetail")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <select
                  className="tw:w-full tw:border tw:border-gray-300 tw:rounded-md tw:h-8 tw:px-2 tw:outline-none tw:text-sm tw:bg-white"
                  value={item.unitType}
                  onChange={(e) => {
                    callback({
                      action: "fieldUpdate",
                      data: {
                        value: e.target.value,
                        index: index,
                        key: "unitType",
                      },
                    });
                  }}
                >
                  {(unitOptions || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:relative">
                  <input
                    type="number"
                    className="tw:w-full tw:border tw:border-gray-300 tw:rounded-md tw:h-8 tw:p-2 tw:outline-none"
                    value={UomPriceService.toDisplayPrice(
                      item.mrp,
                      item.unitType,
                    )}
                    onChange={(e) => {
                      callback({
                        action: "fieldUpdate",
                        data: {
                          value: UomPriceService.toApiPrice(
                            e.target.value,
                            item.unitType,
                          ),
                          index: index,
                          key: "mrp",
                        },
                      });
                    }}
                  />
                  {item.unitType && (
                    <div className="tw:absolute tw:top-full tw:left-2 tw:text-[8px] tw:text-gray-500 tw:leading-tight tw:mt-0.5 tw:pointer-events-none">
                      {UomPriceService.isSmallUom(item.unitType) ? (
                        <>
                          <div>
                            Enter MRP per 1{" "}
                            {UomPriceService.getDisplayUom(item.unitType)}
                          </div>
                          <div>
                            ={" "}
                            <Amount
                              value={UomPriceService.toBaseUnitPrice(item.mrp)}
                              decimalPlaces={3}
                            />{" "}
                            / {item.unitType}
                          </div>
                        </>
                      ) : (
                        <>per {UomPriceService.getDisplayUom(item.unitType)}</>
                      )}
                    </div>
                  )}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:relative">
                  <input
                    type="number"
                    className={clsx(
                      "tw:w-full tw:rounded-md tw:h-8 tw:px-2 tw:outline-none",
                      isMasterLogin
                        ? "tw:bg-gray-50 tw:text-gray-600"
                        : "tw:border tw:border-gray-300",
                    )}
                    value={UomPriceService.toDisplayPrice(
                      item.price,
                      item.unitType,
                    )}
                    onChange={(e) => {
                      callback({
                        action: "fieldUpdate",
                        data: {
                          value: UomPriceService.toApiPrice(
                            e.target.value,
                            item.unitType,
                          ),
                          index: index,
                          key: "price",
                        },
                      });
                    }}
                    disabled={isMasterLogin}
                    readOnly={isMasterLogin}
                  />
                  {item.unitType && (
                    <div className="tw:absolute tw:top-full tw:left-2 tw:text-[8px] tw:text-gray-500 tw:leading-tight tw:mt-0.5 tw:pointer-events-none">
                      {UomPriceService.isSmallUom(item.unitType) ? (
                        <>
                          <div>
                            Enter price per 1{" "}
                            {UomPriceService.getDisplayUom(item.unitType)}
                          </div>
                          <div>
                            ={" "}
                            <Amount
                              value={UomPriceService.toBaseUnitPrice(item.price)}
                              decimalPlaces={3}
                            />{" "}
                            / {item.unitType}
                          </div>
                        </>
                      ) : (
                        <>per {UomPriceService.getDisplayUom(item.unitType)}</>
                      )}
                    </div>
                  )}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                {item.isCloned ? (
                  <AppPopover
                    triggerContent={
                      <button
                        type="button"
                        className="tw:w-full tw:h-8 tw:rounded-md tw:border tw:border-dashed tw:border-gray-300 tw:bg-gray-50 tw:text-gray-400 tw:text-sm tw:flex tw:items-center tw:justify-center tw:cursor-help"
                      >
                        <Lock className="tw:w-3.5 tw:h-3.5" />
                      </button>
                    }
                  >
                    <div className="tw:text-xs tw:text-gray-700 tw:max-w-[220px]">
                      B2C price is locked for duplicate items.
                    </div>
                  </AppPopover>
                ) : (
                  <div className="tw:-mt-1">
                    <B2cPriceConfig
                      config={item.b2cPriceConfig}
                      mrp={item.mrp}
                      unitType={item.unitType}
                      onChange={(config) =>
                        handleB2cPriceConfigChange(config, index)
                      }
                    />
                  </div>
                )}
              </AppTable.Cell>

              <AppTable.Cell>
                {item.isCloned ? (
                  <AppPopover
                    triggerContent={
                      <button
                        type="button"
                        className="tw:w-full tw:h-8 tw:rounded-md tw:border tw:border-dashed tw:border-gray-300 tw:bg-gray-50 tw:text-gray-400 tw:text-sm tw:flex tw:items-center tw:justify-center tw:cursor-help"
                      >
                        <Lock className="tw:w-3.5 tw:h-3.5" />
                      </button>
                    }
                  >
                    <div className="tw:text-xs tw:text-gray-700 tw:max-w-[220px]">
                      Quantity is locked for duplicate items.
                    </div>
                  </AppPopover>
                ) : (
                  <div className="tw:relative">
                    <input
                      type="number"
                      className={clsx(
                        "tw:w-full tw:border-gray-300 tw:rounded-md tw:h-8 tw:p-2 tw:outline-none",
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
                    {item.unitType && (
                      <div className="tw:absolute tw:top-full tw:left-2 tw:text-[8px] tw:text-gray-500 tw:leading-tight tw:mt-0.5 tw:pointer-events-none">
                        {UomPriceService.isSmallUom(item.unitType) ? (
                          <>
                            <div>
                              Enter qty in{" "}
                              {UomPriceService.getDisplayUom(item.unitType)}
                            </div>
                            <div>
                              ={" "}
                              {UomPriceService.toApiQuantity(
                                item.quantity,
                                item.unitType,
                              ) || 0}{" "}
                              {item.unitType}
                            </div>
                          </>
                        ) : (
                          item.unitType
                        )}
                      </div>
                    )}
                  </div>
                )}
              </AppTable.Cell>

              <AppTable.Cell>
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
                  callback={(params) => handleBarcodeChange(params, index)}
                  useSubscribeBtn={false}
                />
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:items-start">
                  <Amount value={item.totalPrice} decimalPlaces={2} />
                  {UomPriceService.isSmallUom(item.unitType) && (
                    <div className="tw:text-[8px] tw:text-gray-500 tw:leading-tight tw:mt-0.5 tw:flex tw:items-center">
                      <DisplayPrice
                        price={item.price || 0}
                        uom={item.unitType}
                        className="tw:text-[8px] tw:text-gray-500"
                        uomClassName="tw:text-[8px] tw:text-gray-500 tw:ml-0.5"
                      />
                      <span className="tw:ml-1">
                        × {item.quantity}{" "}
                        {UomPriceService.getDisplayUom(item.unitType)}
                      </span>
                    </div>
                  )}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:items-stretch tw:gap-1.5">
                  {!item.isCloned && (
                    <AppButton
                      fill="outline"
                      size="small"
                      className="tw:w-full"
                      onClick={() => {
                        callback({
                          action: "clone",
                          data: { ...item, index: index },
                        });
                      }}
                      color="primary"
                    >
                      <Copy />
                      {t("clone")}
                    </AppButton>
                  )}

                  {/* Offer button for non-cloned items (opens consumer offer modal) */}
                  {/* Offer button for non-cloned items (opens consumer offer modal)
                      Hide for cloned items and hide for items that are already consumer offers */}
                  {/* {!item.isCloned && !item.isConsumerOffer && (
                    <AppButton
                      size="small"
                      className="tw:w-full"
                      color="success"
                      onClick={() => handleEnableOfferClick(item, index)}
                    >
                      <Plus />
                      {t("consumerOffer.create")}
                    </AppButton>
                  )} */}

                  <AppButton
                    fill="outline"
                    className="tw:w-full"
                    size="small"
                    color="danger"
                    onClick={() => {
                      callback({ action: "delete", data: { ...item, index } });
                    }}
                  >
                    <Trash2 />
                    {t("remove")}
                  </AppButton>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>
      </AppTable>
    </AppCard>
  );
};

export default DesktopView;
