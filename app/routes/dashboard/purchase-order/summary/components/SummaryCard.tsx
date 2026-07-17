import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import { useTranslation } from "react-i18next";

type Props = {
  title: string;
  poValue: number;
  totalPo: number;
  totalVendors: number;
  type: "total" | "received" | "notReceived";
  description?: string;
  callback: (a: { action: string; data?: any }) => void;
};

const SummaryCard = ({
  title,
  poValue,
  totalPo,
  totalVendors,
  type,
  description,
  callback,
}: Props) => {
  const { t } = useTranslation();

  const renderSummaryItem = (option: {
    label: string;
    value: number;
    isAmount: boolean;
    showView?: boolean;
    viewType?: "vendors" | "po";
  }) => {
    return (
      <div className="tw:flex tw:justify-between tw:gap-4 tw:text-sm">
        <div className="tw:text-slate-600">{option.label}</div>
        <div className="tw:text-slate-900 tw:font-medium tw:flex tw:items-center tw:gap-2">
          {option.isAmount ? <Amount value={option.value} /> : option.value}
          {option.showView && (
            <button
              className="tw:cursor-pointer tw:flex tw:items-center tw:gap-1 tw:border-b tw:border-blue-500"
              onClick={() => {
                callback({
                  action: option.viewType || "",
                  data: {
                    type: type,
                    value: option.value,
                  },
                });
              }}
            >
              <span className="tw:text-blue-500 tw:text-xs">{t("view")}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppCard
      title={
        <span
          className={clsx("tw:font-semibold", {
            "tw:text-primary": type === "total",
            "tw:text-green-500": type === "received",
            "tw:text-red-500": type === "notReceived",
          })}
        >
          {title}
        </span>
      }
      className={clsx("tw:mb-0 tw:border-t-4", {
        "tw:border-t-primary": type === "total",
        "tw:border-t-green-500": type === "received",
        "tw:border-t-red-500": type === "notReceived",
      })}
    >
      {description ? (
        <div className="tw:text-xs tw:text-slate-500 tw:mb-2">
          {description}
        </div>
      ) : null}
      {renderSummaryItem({
        label: t("totalPO"),
        value: totalPo || 0,
        isAmount: false,
        showView: true,
        viewType: "po",
      })}
      <Divider className="tw:!my-2" />
      {renderSummaryItem({
        label: t("totalVendors"),
        value: totalVendors || 0,
        isAmount: false,
        showView: true,
        viewType: "vendors",
      })}
      <Divider className="tw:!my-2" />
      {renderSummaryItem({
        label: t("totalPOValue"),
        value: poValue || 0,
        isAmount: true,
      })}
    </AppCard>
  );
};

export default SummaryCard;
