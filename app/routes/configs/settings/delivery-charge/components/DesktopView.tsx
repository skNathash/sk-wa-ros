import { Edit3Icon, Trash2Icon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import ChargeSlabPopup from "./ChargeSlabPopup";

interface Slab {
  fromOrderValue: number;
  toOrderValue: number;
  isFree: boolean;
  chargeSlabKiloMeter?: Array<{ from: number; to: number; charge: number }>;
}

interface DesktopViewProps {
  loading?: boolean;
  data?: Slab[];
  callback: (action: string, data?: any) => void;
}

const getHeaders = (t: any): TableHeaderItem[] => [
  { label: t("deliveryCharge.orderValue"), key: "orderValue" },
  {
    label: t("deliveryCharge.deliveryType"),
    key: "deliveryType",
    isCentered: true,
  },
  {
    label: t("deliveryCharge.actions"),
    key: "actions",
    isCentered: true,
    width: "160px",
  },
];

const DesktopView: React.FC<DesktopViewProps> = ({
  loading = false,
  data = [],
  callback,
}) => {
  const { t } = useTranslation(["common"]);
  const headers = getHeaders(t);

  return (
    <AppTable size="sm" className="tw:mt-2">
      <AppTable.Header>
        <TableHeader headers={headers} noBg />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={6} />
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              {t("deliveryCharge.noDeliveryChargeSlabs")}
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((slab, idx) => (
            <AppTable.Row key={idx}>
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col">
                  <div className="tw:font-medium tw:flex tw:gap-2">
                    <Amount
                      value={slab.fromOrderValue}
                      decimalPlaces={2}
                      className="tw:text-primary"
                    />
                    <span>-</span>
                    <Amount
                      value={slab.toOrderValue}
                      decimalPlaces={2}
                      className="tw:text-primary"
                    />
                  </div>
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center">
                <AppBadge variant={slab.isFree ? "success" : "danger"}>
                  {slab.isFree
                    ? t("deliveryCharge.free")
                    : t("deliveryCharge.chargesApply")}
                </AppBadge>
                {!slab.isFree && (
                  <div className="tw:mt-1">
                    <ChargeSlabPopup slabs={slab.chargeSlabKiloMeter || []} />
                  </div>
                )}
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center">
                <div className="tw:flex tw:justify-center tw:items-center">
                  <AppButton
                    size="small"
                    color="primary"
                    fill="clear"
                    noPadding
                    onClick={() => callback("edit", { index: idx })}
                  >
                    <Edit3Icon size={14} />
                  </AppButton>

                  <AppButton
                    size="small"
                    color="danger"
                    fill="clear"
                    noPadding
                    onClick={() => callback("remove", { index: idx })}
                  >
                    <Trash2Icon size={14} className="tw:text-red-500" />
                  </AppButton>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
