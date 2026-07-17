import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppPopover from "~/components/core/popover/AppPopover";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

const PickedSanpshotsInfo = ({
  pickedSanpshots,
  selectedStockUom,
}: {
  pickedSanpshots: any[];
  selectedStockUom?: string;
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppPopover
      triggerContent={
        <button className="tw:cursor-pointer tw:text-gray-500 tw:flex tw:items-center tw:gap-1 tw:text-xs">
          {t("viewDetails")}
          <Info size={14} />
        </button>
      }
    >
      <div className="tw:text-xs tw:mb-2">
        <div className="tw:font-semibold tw:text-gray-900">
          {t("pickedSnapshots")}
        </div>
      </div>
      {pickedSanpshots?.map((snapshot) => (
        <div
          key={snapshot._id}
          className="tw:gap-2 tw:text-xs tw:border tw:border-gray-200 tw:p-2 tw:rounded-md tw:mb-2 tw:grid tw:grid-cols-2"
        >
          <KeyValue label={t("mrp")} size="xs">
            <Amount value={snapshot.mrp} />
          </KeyValue>
          <KeyValue label={t("barcode")} size="xs">
            {snapshot.barcode}
          </KeyValue>
          <KeyValue label={t("stock")} size="xs">
            <DisplayQty
              qty={snapshot.quantity}
              isLooseQty={false}
              uom={selectedStockUom}
            />
          </KeyValue>
          <KeyValue label={t("expiryDate")} size="xs">
            {snapshot.expiry ? (
              <DateFormat value={snapshot.expiry} formatStr="dd MMM yyyy" />
            ) : (
              "--"
            )}
          </KeyValue>
        </div>
      ))}
    </AppPopover>
  );
};

export default PickedSanpshotsInfo;
