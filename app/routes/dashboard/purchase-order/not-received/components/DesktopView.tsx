import { CheckCircle, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import InvoiceDownload from "~/shared/orders/invoice-download/InvoiceDownload";
import ReceiveBoxFlow from "~/shared/purchase-order/components/receive-box-flow/ReceiveBoxFlow";

type Props = {
  data: any[];
  callback: (a: { action: string; data: any; index?: number }) => void;
  tab?: string;
  sortKey?: string;
  sortValue?: "asc" | "desc" | undefined;
  sortCb?: (data: any) => void;
  loading: boolean;
  showLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
};

const headers = [
  { label: "Box No", key: "refNo", width: "15%", langKey: "boxNo" },
  {
    label: "Order ID",
    key: "orderData.refId",
    width: "17%",
    langKey: "orderId",
  },
  {
    label: "Invoice No",
    key: "invoiceData.refId",
    width: "14%",
    langKey: "invoiceNo",
  },
  {
    label: "Purchased From",
    key: "from.name",
    width: "14%",
    langKey: "purchasedFrom",
  },
  {
    label: "Total Items",
    key: "totalItems",
    width: "10%",
    isCentered: true,
    langKey: "totalItems",
  },
  {
    label: "Shipped On",
    key: "createdAt",
    width: "14%",
    isCentered: true,
    langKey: "shippedOn",
  },
  {
    label: "Action",
    key: "actions",
    width: "15%",
    isCentered: true,
    langKey: "action",
  },
];

const containerStyle = { maxHeight: "calc(100vh - 200px)" };

const DesktopView = ({
  data,
  callback,
  loading,
  showLoadMore,
  loadingMore,
  loadMore,
  totalCount,
}: Props) => {
  const { t } = useTranslation(["common"]);

  if (!loading && data.length === 0) return null;

  return (
    <AppTable
      size="sm"
      condensed
      fixedLayout={true}
      container
      minWidth="1000px"
      stickyHeader
      containerStyle={containerStyle}
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={12} />
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell>{row?.refNo || "--"}</AppTable.Cell>
              <AppTable.Cell>
                {row?.orderData?.refId ? (
                  <AppLink asLink href={row.orderLink} showLinkColor={true}>
                    {row.orderData.refId}
                  </AppLink>
                ) : (
                  "--"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div>{row?.invoiceData?.refId || "--"}</div>
                  {row?.invoiceData?.refId ||
                  row?.invoiceData?.documentAssetId ? (
                    <InvoiceDownload
                      invoiceNo={
                        row?.from?.type === "SELLER"
                          ? undefined
                          : row?.invoiceData?.refId
                      }
                      invoiceDocumentId={
                        row?.from?.type === "SELLER"
                          ? row?.invoiceData?.documentAssetId
                          : undefined
                      }
                    />
                  ) : null}
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:font-medium">
                {row?.from?.name ? (
                  row.vendorLink ? (
                    <AppLink asLink href={row.vendorLink}>
                      {row.from.name}
                    </AppLink>
                  ) : (
                    <div>{row.from.name}</div>
                  )
                ) : (
                  "N/A"
                )}
                <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                  {row?.from?.refId || "--"}
                  {row._vendorType && (
                    <VendorTypeBadge
                      type={row._vendorType}
                      color={row._vendorTypeColor}
                      description={row._vendorTypeInfo}
                      className="tw:text-[10px]"
                    />
                  )}
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <div>
                  {row?.totalItems ?? "--"}{" "}
                  <span className="tw:text-sm">items</span>
                </div>
                <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  <Amount
                    value={row?.totalValue ?? row?.payableAmount ?? 0}
                    decimalPlaces={2}
                  />
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                {row?.createdAt ? (
                  <>
                    <DateFormat value={row.createdAt} formatStr="dd MMM yyyy" />
                    <div className="tw:text-xs tw:text-gray-500">
                      <DateFormat value={row.createdAt} formatStr="hh:mm a" />
                    </div>
                  </>
                ) : (
                  "--"
                )}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <div className="tw:flex tw:items-center tw:justify-center tw:gap-2">
                  <AppButton
                    size="small"
                    onClick={() => {
                      callback({ action: "view-items", data: row, index: idx });
                    }}
                    color="light"
                    fill="outline"
                  >
                    <Eye size={16} />
                  </AppButton>

                  <ReceiveBoxFlow
                    data={row}
                    index={idx}
                    onReceived={() =>
                      callback({ action: "received", data: row, index: idx })
                    }
                  >
                    <AppButton size="small" color="primary">
                      <CheckCircle size={16} />
                      {t("receive")}
                    </AppButton>
                  </ReceiveBoxFlow>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}

        {showLoadMore && !loading && data.length > 0 && (
          <AppTable.Row>
            <AppTable.Cell
              colSpan={headers.length}
              className="tw:text-center tw:py-4"
            >
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={totalCount}
                loadedCount={data.length}
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
