import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment } from "react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import type { Payment } from "./helper";

type DesktopViewProps = {
  data: Payment[];
  expanded: string | null;
  toggle: (item: Payment) => void;
};

const headers: TableHeaderItem[] = [
  { label: "", key: "expand", width: "4%" },
  { label: "Date", langKey: "date", key: "date", width: "14%" },
  {
    label: "Vendor / Description",
    langKey: "vendorDescription",
    key: "vendor",
    width: "34%",
  },
  { label: "Reference", langKey: "reference", key: "reference", width: "20%" },
  { label: "Mode", langKey: "mode", key: "mode", width: "12%" },
  {
    label: "Amount",
    langKey: "amount",
    key: "amount",
    width: "16%",
    isRightAligned: true,
  },
];

export const modeBadge = (item: Payment) => (
  <span className="tw:rounded tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:text-gray-600">
    {item.mode}
  </span>
);

/** The ledger and instrument references behind the payment, shown when a row opens. */
export const detailRows = (item: Payment) => (
  <div className="tw:grid tw:gap-1.5 tw:bg-gray-50 tw:px-4 tw:py-2 tw:md:grid-cols-2">
    {item.description && (
      <div className="tw:col-span-full tw:flex tw:items-start tw:gap-2 tw:text-[11px]">
        <span className="tw:shrink-0 tw:text-gray-500">Description</span>
        <span className="tw:font-semibold tw:text-gray-700">
          {item.description}
        </span>
      </div>
    )}
    <div className="tw:flex tw:items-center tw:gap-2 tw:text-[11px]">
      <span className="tw:text-gray-500">Transaction</span>
      <span className="tw:truncate tw:font-semibold tw:text-gray-700">
        {item.transactionId}
      </span>
    </div>
    <div className="tw:flex tw:items-center tw:gap-2 tw:text-[11px]">
      <span className="tw:text-gray-500">Payment reference</span>
      <span className="tw:truncate tw:font-semibold tw:text-gray-700">
        {item.paymentReference}
      </span>
    </div>
    <div className="tw:flex tw:items-center tw:gap-2 tw:text-[11px]">
      <span className="tw:text-gray-500">Channel</span>
      <span className="tw:font-semibold tw:text-gray-700">
        {item.paymentMode}
      </span>
    </div>
    <div className="tw:flex tw:items-center tw:gap-2 tw:text-[11px]">
      <span className="tw:text-gray-500">Paid by</span>
      <span className="tw:truncate tw:font-semibold tw:text-gray-700">
        {item.paidBy}
      </span>
    </div>
  </div>
);

const DesktopView = ({ data, expanded, toggle }: DesktopViewProps) => {
  /* Nothing paid in the range — the card already carries the white, so the
     empty read stands on its own without the table chrome. */
  if (data.length === 0) return <NoData />;

  return (
    <AppTable size="sm" fixedLayout>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {data.map((item) => (
          <Fragment key={item.id}>
            <AppTable.Row
              className="tw:cursor-pointer"
              onClick={() => toggle(item)}
            >
              <AppTable.Cell className="tw:text-gray-400">
                {expanded === item.id ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-xs tw:text-gray-600">
                {item.dateLabel}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-1.5">
                  <AppLink asLink noUnderline href={item.link}>
                    <span className="tw:text-sm tw:font-semibold tw:text-gray-800">
                      {item.vendor}
                    </span>
                  </AppLink>
                  <span className="tw:rounded tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:text-gray-600">
                    {item.vendorTypeLabel}
                  </span>
                </div>
                <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                  {item.description}
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:truncate tw:text-xs tw:text-gray-600">
                {item.reference}
              </AppTable.Cell>
              <AppTable.Cell>{modeBadge(item)}</AppTable.Cell>
              <AppTable.Cell className="tw:text-right tw:text-sm tw:font-bold tw:text-red-600">
                −<Amount value={item.amount} decimalPlaces={0} />
              </AppTable.Cell>
            </AppTable.Row>
            {expanded === item.id && (
              <AppTable.Row noHover>
                <AppTable.Cell colSpan={6} className="tw:p-0">
                  {detailRows(item)}
                </AppTable.Cell>
              </AppTable.Row>
            )}
          </Fragment>
        ))}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
