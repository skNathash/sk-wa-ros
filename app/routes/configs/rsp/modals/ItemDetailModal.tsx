import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppModal from "~/components/core/modal/AppModal";
import PriceChangeLog from "~/modals/feature/configs/price-config/PriceChangeLog";

interface ItemDetailModalProps {
  show: boolean;
  data: any;
  callback: (action: { action: string; data?: any }) => void;
  type: string;
}

const ItemDetailModal = ({
  show,
  data,
  callback,
  type,
}: ItemDetailModalProps) => {
  const { t } = useTranslation(["common"]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  if (!data) return null;

  return (
    <AppModal show={show} callback={callback} className="offcanvas-modal">
      <AppModal.Title onClose={handleClose} noShadow={true}>
        {t("rspConfigurationDetails")}
      </AppModal.Title>
      <AppModal.Content className="ion-padding modal-bg">
        <InfoBlock size="sm" className="tw:mb-4" shadow={true}>
          <div>
            {type === "network" ? (
              <div>{t("networkConfigurationDescription")}</div>
            ) : (
              <div>{t("customerConfigurationDescription")}</div>
            )}
          </div>
        </InfoBlock>
        {/* Product Information */}
        <AppCard>
          <div className="tw:mb-4">
            <div className="tw:mb-2 tw:font-semibold tw:text-lg">
              {data.deal?.name}
            </div>
            <div className="tw:flex tw:gap-4 tw:flex-wrap">
              <KeyValue label="ID" size="sm" horizontal>
                {data.deal?.id}
              </KeyValue>

              <KeyValue label="MRP" size="sm" horizontal>
                <Amount
                  value={data.mrp}
                  className="tw:text-red-500 tw:font-semibold"
                />
              </KeyValue>

              <KeyValue label="Purchase Price" size="sm" horizontal>
                <Amount
                  value={
                    type === "network"
                      ? data.b2bPrice || data.b2bprice
                      : data.purchasePrice || data.b2bprice
                  }
                  decimalPlaces={2}
                  className="tw:text-primary tw:font-semibold"
                />
              </KeyValue>
            </div>
          </div>
        </AppCard>

        {/* Price Information */}
        <AppCard>
          <div className="tw:mb-2 tw:text-base tw:flex tw:items-center tw:gap-2">
            {t("priceInformation")}
          </div>
          <div>
            <div className="tw:bg-gray-100 tw:p-3 tw:rounded-md tw:flex tw:justify-between">
              <KeyValue label="Selling Price" size="sm" horizontal>
                <Amount
                  value={
                    type === "network"
                      ? data.b2bPrice || data.sellingPrice
                      : data.b2cPrice || data.sellingPrice
                  }
                />
              </KeyValue>
              <KeyValue label="Profit" size="sm" horizontal>
                <Amount value={data.profit} />
              </KeyValue>
            </div>
          </div>
        </AppCard>

        {/* Sales Performance */}
        <AppCard>
          <div className="tw:mb-2 tw:text-base tw:flex tw:items-center tw:gap-2">
            {t("salesPerformance")}
          </div>
          <div className="tw:grid tw:grid-cols-2 tw:gap-2">
            <div className="tw:bg-gray-100 tw:p-2 tw:rounded-md">
              <KeyValue label={t("last7Days")} size="sm" horizontal>
                <Amount value={data.salesLast7} />
              </KeyValue>
            </div>

            <div className="tw:bg-gray-100 tw:p-2 tw:rounded-md">
              <KeyValue label={t("last15Days")} size="sm" horizontal>
                <Amount value={data.salesLast15} />
              </KeyValue>
            </div>

            <div className="tw:bg-gray-100 tw:p-2 tw:rounded-md">
              <KeyValue label={t("last30Days")} size="sm" horizontal>
                <Amount value={data.salesLast30} />
              </KeyValue>
            </div>

            <div className="tw:bg-gray-100 tw:p-2 tw:rounded-md">
              <KeyValue label={t("last90Days")} size="sm" horizontal>
                <Amount value={data.salesLast90} />
              </KeyValue>
            </div>
          </div>
        </AppCard>

        {/* Audit Log */}
        <PriceChangeLog logs={data?.auditLog} />
      </AppModal.Content>
    </AppModal>
  );
};

export default ItemDetailModal;
