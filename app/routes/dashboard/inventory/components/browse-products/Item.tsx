import { Calendar, Eye, MoreHorizontal, Package, Plus } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import AppPopover from "~/components/core/popover/AppPopover";
import DealSummaryPopover from "~/components/feature/inventory/popover/deal-sales-summary/DealSummaryPopover";
import Rbac from "~/components/core/rbac/Rbac";
import AuthService from "~/services/AuthService";

const rbacRoles = {
  addStock: ["INVENTORY.ADD-STOCK"],
};

interface ItemProps {
  item: any;
  onAction?: (p: { action: string; data?: any }) => void;
}

const Item: React.FC<ItemProps> = ({ item, onAction }) => {
  const { t } = useTranslation(["common"]);

  const handleAddStock = () => {
    if (onAction) onAction({ action: "add-stock", data: item });
  };

  const handleView = () => {
    if (onAction) onAction({ action: "view", data: item });
  };

  const handleStatusCallback = (res: any) => {
    // forward submit event to parent
    if (res?.action === "submit") {
      if (onAction)
        onAction({
          action: "status-updated",
          data: {
            ...item,
            status: item.status === "Active" ? "Inactive" : "Active",
          },
        });
    }
  };

  return (
    <div className="tw:bg-white tw:shadow tw:rounded-md tw:relative tw:block">
      <AppLink
        asLink
        href={`/dashboard/inventory/products/view/${item._id}`}
        className="tw:bg-white tw:p-1 tw:relative tw:flex tw:items-center tw:justify-center"
      >
        <AppBadge
          variant={item.status === "Active" ? "success" : "danger"}
          className="tw:text-xs tw:absolute tw:top-0 tw:right-0"
        >
          {item.status}
        </AppBadge>
        {item.images && item.images.length > 0 ? (
          <ImgRender
            assetId={
              item.images && item.images.length > 0 ? item.images[0] : undefined
            }
            alt={item.name}
            className="tw:h-32 tw:object-cover tw:w-full"
          />
        ) : (
          <Package className="tw:w-32 tw:h-32 tw:text-gray-200" />
        )}
      </AppLink>

      <div className="tw:p-2">
        <div className="tw:h-16">
          <div className="tw:text-sm tw:font-medium tw:line-clamp-3 tw:mb-2">
            {item.name}
          </div>
        </div>

        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-center">
          <div className="tw:flex tw:items-center tw:gap-1">
            <AppPopover
              triggerContent={
                <MoreHorizontal
                  size={18}
                  className="tw:text-gray-500 tw:cursor-pointer"
                />
              }
            >
              <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                <KeyValue
                  label={t("brand")}
                  valueClassName="tw:font-medium"
                  className="tw:col-span-2"
                >
                  <span>{item.brand?.name || "--"}</span>
                </KeyValue>

                <KeyValue
                  label={t("category")}
                  valueClassName="tw:font-medium"
                  className="tw:col-span-2"
                >
                  {item.category?.name || "--"}
                </KeyValue>

                <KeyValue label={t("hsn")} valueClassName="tw:font-medium">
                  {item.hsn || "--"}
                </KeyValue>
                <KeyValue label={t("gst")} valueClassName="tw:font-medium">
                  {item.gst || "--"} {item.gst ? "%" : ""}
                </KeyValue>

                <KeyValue label={t("id")} valueClassName="tw:font-medium">
                  {item.id || "--"}
                </KeyValue>

                {/* stock */}
                <KeyValue label={t("stock")} valueClassName="tw:font-medium">
                  {item.maxQty || 0} {t("units")}
                </KeyValue>

                {/* movement type */}
                <KeyValue label={t("movement")} valueClassName="tw:font-medium">
                  <AppBadge
                    variant={item._movementTypeColor || "light"}
                    className="tw:text-xs"
                  >
                    {item.movementType || t("normal")}
                  </AppBadge>

                  {item._raw?.nearExpiry?.desc && (
                    <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2">
                      <Calendar className="tw:w-4 tw:h-4 tw:text-orange-500" />
                      <span className="tw:text-slate-500 tw:text-xs">
                        {item._raw.nearExpiry.desc}
                      </span>
                    </div>
                  )}
                </KeyValue>

                {/* activity */}
                <KeyValue label={t("activity")} valueClassName="tw:font-medium">
                  <div className="tw:flex tw:items-center tw:gap-1">
                    {item.salesAnalytics?.last7Days?.quantity || 0} {t("units")}
                    <AppPopover
                      triggerContent={
                        <button className="tw:cursor-pointer">
                          <Eye size={14} />
                        </button>
                      }
                      side="right"
                      align="center"
                    >
                      <DealSummaryPopover
                        salesAnalytics={item.salesAnalytics}
                      />
                    </AppPopover>
                  </div>
                </KeyValue>
              </div>
            </AppPopover>
          </div>
          <div className="tw:flex tw:items-center tw:gap-2">
            <Rbac
              roles={rbacRoles.addStock}
              forceDisplay={AuthService.isMasterLogin()}
            >
              <AppButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddStock();
                }}
                fill="outline"
                color="primary"
                size="small"
              >
                <Plus className="tw:w-4 tw:h-4" />
              </AppButton>
            </Rbac>

            <AppButton
              onClick={(e) => {
                e.stopPropagation();
                handleView();
              }}
              fill="outline"
              color="secondary"
              size="small"
            >
              <Eye className="tw:w-4 tw:h-4" />
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Item;
