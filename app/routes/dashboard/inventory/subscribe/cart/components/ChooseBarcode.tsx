import { Plus, X } from "lucide-react";
import { AppSelect } from "~/components/core/form";
import { useTranslation } from "react-i18next";
import BarcodeInput from "~/shared/inventory/components/barcode-input/BarcodeInput";

const ChooseBarcode = ({
  barcode,
  barcodeOptions,
  showbarcodeOption,
  dealId,
  useSubscribeBtn,
  uom,
  callback,
}: {
  barcode: string;
  barcodeOptions: any[];
  showbarcodeOption: boolean;
  dealId?: string;
  useSubscribeBtn?: boolean;
  uom?: string;
  callback: (params: { action: string; data?: any }) => void;
}) => {
  const { t } = useTranslation(["common"]);
  const handleBarcodeChange = (barcode: string) => {
    callback({
      action: "fieldUpdate",
      data: {
        value: barcode,
      },
    });
  };

  return (
    <>
      {showbarcodeOption ? (
        <>
          {barcodeOptions?.length > 0 ? (
            <div className="tw:flex tw:flex-col tw:items-start tw:gap-2 tw:relative tw:w-full">
              <AppSelect
                options={barcodeOptions}
                placeholder={t("selectBarcode")}
                value={barcode}
                onChange={handleBarcodeChange}
                inputClassName="tw:w-full"
                className="tw:w-full"
              />
              <div className="tw:absolute tw:-bottom-5 tw:left-0">
                <button
                  type="button"
                  className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1 tw:cursor-pointer tw:z-40"
                  onClick={() => {
                    callback({
                      action: "addBarcode",
                    });
                  }}
                >
                  <Plus size={10} />
                  {t("addNewBarcode")}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="tw:relative tw:w-full">
          <BarcodeInput
            value={barcode}
            dealId={dealId}
            useSubscribeBtn={useSubscribeBtn}
            uom={uom}
            onChange={(value) => {
              callback({
                action: "fieldUpdate",
                data: { value },
              });
            }}
            callback={(params) => {
              if (params.action === "markAsLocal") {
                callback({ action: "markAsLocal", data: params.data });
              }
            }}
            placeholder={t("enterBarcode")}
          />
          {barcodeOptions.length > 0 && (
            <div className="tw:absolute tw:-bottom-5 tw:left-0">
              <button
                type="button"
                className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1 tw:cursor-pointer tw:z-40"
                onClick={() => {
                  callback({
                    action: "cancelBarcode",
                    data: {},
                  });
                }}
              >
                <X size={10} />
                {t("cancel")}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChooseBarcode;
