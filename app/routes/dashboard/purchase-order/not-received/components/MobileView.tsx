import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { Box, CheckCircle, Eye } from "lucide-react";
import AppLink from "~/components/core/link/AppLink";
import InvoiceDownload from "~/shared/orders/invoice-download/InvoiceDownload";
import KeyValue from "~/components/core/key-value/KeyValue";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

type Props = {
  data: any[];
  callback: (a: { action: string; data: any; index?: number }) => void;
  loading: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
};

const MobileView = ({ data, callback, loading }: Props) => {
  const { t } = useTranslation(["common"]);

  if (!loading && (!data || data.length === 0)) return null;

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {loading
        ? // Simple skeleton placeholders
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="tw:p-3 tw:bg-white tw:rounded tw:shadow-sm tw:animate-pulse"
            >
              <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:mb-2" />
              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-3/4" />
            </div>
          ))
        : data.map((row, idx) => (
            <AppCard
              key={row._id || idx}
              className=" tw:flex tw:flex-col tw:mb-0"
            >
              {/* Top grid: Box, Invoice No, Order Id, Shipped On (2 columns) */}
              <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:items-start">
                <div>
                  <KeyValue label={t("boxNo")} size="sm">
                    <div className="tw:text-sm tw:font-medium tw:flex tw:items-center tw:gap-1">
                      {row?.refNo || "--"}
                    </div>
                  </KeyValue>
                </div>

                <div>
                  <KeyValue label={t("invoiceNo")} size="sm">
                    <div className="tw:text-sm tw:flex tw:items-start tw:gap-2 tw:flex-wrap">
                      <div>{row?.invoiceData?.refId || "--"}</div>
                      {row?.invoiceData?.refId ||
                      row?.invoiceData?.documentAssetId ? (
                        <InvoiceDownload
                          invoiceNo={
                            row?.isSellerOrder
                              ? undefined
                              : row?.invoiceData?.refId
                          }
                          invoiceDocumentId={
                            row?.isSellerOrder
                              ? row?.invoiceData?.documentAssetId
                              : undefined
                          }
                        />
                      ) : null}
                    </div>
                  </KeyValue>
                </div>

                <div>
                  <KeyValue label={t("orderId")} size="sm">
                    <div className="tw:text-sm">
                      {row?.orderData?.refId ? (
                        <AppLink
                          asLink
                          href={row.orderLink}
                          showLinkColor={true}
                        >
                          {row.orderData.refId}
                        </AppLink>
                      ) : (
                        "--"
                      )}
                    </div>
                  </KeyValue>
                </div>

                <div>
                  <KeyValue label={t("shippedOn")} size="sm">
                    {row?.createdAt ? (
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <div className="tw:text-sm tw:font-medium">
                          <DateFormat
                            value={row.createdAt}
                            formatStr="dd MMM yyyy"
                          />
                        </div>
                        <div className="tw:text-xs tw:text-gray-500">
                          <DateFormat
                            value={row.createdAt}
                            formatStr="hh:mm a"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="tw:text-sm">--</div>
                    )}
                  </KeyValue>
                </div>
              </div>

              {/* Divider */}
              <div className="tw:my-3 tw:border-t tw:border-gray-200" />

              {/* Two-column grid: total items, total value */}
              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <div>
                  <KeyValue label={t("totalItems")} size="sm">
                    <div className="tw:text-sm">
                      {row?.totalItems ?? "--"}{" "}
                      <span className="tw:text-xs">items</span>
                    </div>
                  </KeyValue>
                </div>

                <div>
                  <KeyValue label={t("totalValue")} size="sm">
                    <div className="tw:text-sm">
                      <Amount
                        value={row?.totalValue ?? row?.payableAmount ?? 0}
                        decimalPlaces={2}
                      />
                    </div>
                  </KeyValue>
                </div>
              </div>

              {/* Vendor and actions: vendor name left, buttons right */}
              <div className="tw:mt-3 tw:flex tw:justify-between tw:items-center">
                <div className="tw:flex-1">
                  <KeyValue label={t("purchasedFrom")} size="sm">
                    <div className="tw:text-sm tw:font-medium tw:whitespace-normal">
                      {row?.from?.name ? (
                        row.vendorLink ? (
                          <AppLink
                            asLink
                            href={row.vendorLink}
                            showLinkColor={true}
                          >
                            {row.from.name}
                          </AppLink>
                        ) : (
                          <div>{row.from.name}</div>
                        )
                      ) : (
                        "N/A"
                      )}
                    </div>
                    {row._vendorType && (
                      <div className="tw:mt-1">
                        <VendorTypeBadge
                          type={row._vendorType}
                          color={row._vendorTypeColor}
                          description={row._vendorTypeInfo}
                          className="tw:text-[10px]"
                        />
                      </div>
                    )}
                  </KeyValue>
                </div>

                <div className="tw:flex tw:gap-2">
                  <AppButton
                    size="small"
                    color="light"
                    fill="outline"
                    onClick={() =>
                      callback({ action: "view-items", data: row, index: idx })
                    }
                  >
                    <Eye />
                  </AppButton>

                  <AppButton
                    size="small"
                    color="success"
                    onClick={() =>
                      callback({ action: "receive", data: row, index: idx })
                    }
                  >
                    <CheckCircle />
                    {t("receive")}
                  </AppButton>
                </div>
              </div>
            </AppCard>
          ))}
    </div>
  );
};

export default MobileView;
