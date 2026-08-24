import { useState } from "react";
import { useTranslation } from "react-i18next";
import Orders from "./orders/Orders";

/**
 * "Assign next" pane — a header strip over the ready-order list. The list owns
 * its own filtering, pagination and selection (kept in the `orderId` query
 * param), so the pane only carries the title and the ready count it reports
 * back.
 */
export default function AssignRunnerSidePane() {
  const { t } = useTranslation(["common"]);
  const [readyCount, setReadyCount] = useState(0);

  return (
    <div className="tw:flex tw:h-full tw:flex-col tw:gap-3">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <h2 className="tw:text-lg tw:font-bold tw:text-slate-900">
          {t("assignNext", "Assign next")}
        </h2>
        <span className="tw:text-xs tw:font-medium tw:text-slate-500">
          {readyCount} {t("ready", "ready")}
        </span>
      </div>

      <Orders onCountChange={setReadyCount} />
    </div>
  );
}
