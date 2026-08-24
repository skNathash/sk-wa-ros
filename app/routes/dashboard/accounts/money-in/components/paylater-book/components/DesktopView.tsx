import clsx from "clsx";
import { Eye, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import type { PaylaterCustomer } from "../helper";
import CustomerAvatar from "./CustomerAvatar";
import UsedBar from "./UsedBar";

type DesktopViewProps = {
  data: PaylaterCustomer[];
  emit: (action: string, item?: PaylaterCustomer) => void;
};

const headers: TableHeaderItem[] = [
  { label: "Customer", langKey: "customer", key: "name", width: "30%" },
  { label: "Code", langKey: "code", key: "code", width: "18%" },
  {
    label: "Limit",
    langKey: "limit",
    key: "limit",
    width: "13%",
    isRightAligned: true,
  },
  {
    label: "Used",
    langKey: "used",
    key: "used",
    width: "15%",
    isRightAligned: true,
  },
  {
    label: "Due",
    langKey: "due",
    key: "due",
    width: "12%",
    isRightAligned: true,
  },
  {
    label: "Action",
    langKey: "action",
    key: "action",
    width: "12%",
    isRightAligned: true,
  },
];

// Desktop read of the credit book: limit / used / due columns with the
// drawn-limit bar.
const DesktopView = ({ data, emit }: DesktopViewProps) => {
  const { t } = useTranslation(["common"]);

  if (data.length === 0) return <NoData />;

  return (
    <AppTable size="sm" fixedLayout>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {data.map((item) => (
            <AppTable.Row key={item.id}>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <CustomerAvatar item={item} />
                  <AppLink
                    asLink
                    noUnderline
                    href={item.paylaterLink}
                    className="tw:min-w-0"
                  >
                    <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
                      {item.name}
                    </div>
                    <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                      {item.cycleLabel}
                    </div>
                  </AppLink>
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-xs tw:text-gray-600">
                <div>{item.code}</div>
                <div className="tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-gray-500">
                  <Phone size={10} />
                  {item.mobile}
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-right tw:text-sm tw:text-gray-700">
                <Amount value={item.limit} decimalPlaces={0} />
              </AppTable.Cell>
              <AppTable.Cell>
                <UsedBar item={item} />
              </AppTable.Cell>
              <AppTable.Cell
                className={clsx(
                  "tw:text-right tw:text-xs",
                  item.overdue
                    ? "tw:font-semibold tw:text-emerald-700"
                    : "tw:text-gray-500",
                )}
              >
                {item.dueLabel}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:justify-end">
                  <AppButton
                    size="small"
                    fill="outline"
                    color="light"
                    onClick={() => emit("details", item)}
                  >
                    <Eye size={14} />
                    {t("details")}
                  </AppButton>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
