import {
  Building2,
  CircleAlert,
  Eye,
  IndianRupee,
  Phone,
  Truck,
  MapPin,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import Rbac from "~/components/core/rbac/Rbac";
import VendorBrandChip from "~/shared/vendor/components/vendor-brand-chip/VendorBrandChip";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import type { PaginationState, TableHeaderItem } from "~/types/CommonTypes";

const rbacRoles = {
  pay: ["ACCOUNTS.RECORD-PAYMENT"],
};

const headers: TableHeaderItem[] = [
  { label: "#", key: "sno", width: "4%" },
  { label: "Vendor", key: "vendor", width: "30%" },
  {
    label: "Total Purchase",
    langKey: "totalPurchase",
    key: "totalPurchase",
    width: "13%",
  },
  { label: "Distance", langKey: "distance", key: "distance", width: "11%" },
  { label: "Brands", langKey: "brands", key: "brands", width: "14%" },
  { label: "Alerts", key: "alerts", width: "14%" },
  { label: "Actions", key: "actions", width: "14%", isRightAligned: true },
];

type Props = {
  data: any[];
  loading: boolean;
  loadingMore: boolean;
  hasMoreData: boolean;
  loadMore: () => void;
  pagination: PaginationState;
  callback: (a: { action: string; data: Record<string, any> }) => void;
};

const DesktopView = ({
  data,
  loading,
  loadingMore,
  hasMoreData,
  loadMore,
  pagination,
  callback,
}: Props) => {
  const { t } = useTranslation(["common"]);

  return (
    <>
      <AppTable>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={5} />
          ) : data.length === 0 ? (
            <AppTable.Row noHover>
              <AppTable.Cell colSpan={headers.length}>
                <NoData />
              </AppTable.Cell>
            </AppTable.Row>
          ) : (
            data.map((item: any, index: number) => (
              <AppTable.Row key={item._id}>
                <AppTable.Cell>{index + 1}</AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:gap-2">
                    <span className="tw:bg-gray-100 tw:rounded-md tw:w-9 tw:h-9 tw:shrink-0 tw:flex tw:items-center tw:justify-center">
                      <Building2 size={18} className="tw:text-gray-500" />
                    </span>
                    <div className="tw:min-w-0">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <AppLink
                          asLink={true}
                          href={`/dashboard/vendor/view/${item._id}`}
                          className="tw:font-medium tw:text-inherit tw:no-underline hover:tw:underline"
                        >
                          {item.name}
                        </AppLink>
                      </div>
                      <div className="tw:flex tw:flex-wrap tw:gap-x-3 tw:gap-y-0.5 tw:items-center tw:text-xs tw:text-gray-500">
                        {/* Network tag leads the meta row — it qualifies the
                            vendor, so it reads before the ID and phone. */}
                        {item._vendorType && (
                          <VendorTypeBadge
                            type={item._vendorType}
                            color={item._vendorTypeColor}
                            description={item._vendorTypeInfo}
                            size="xs"
                            className="tw:shrink-0"
                          />
                        )}
                        <span>
                          <span className="tw:font-medium">ID: </span>
                          <span className="tw:wrap-break-word">
                            {item.vendorId || item._id}
                          </span>
                        </span>
                        {item._contact?.mobile ? (
                          <span className="tw:flex tw:gap-1.5 tw:items-center">
                            <Phone size={12} />
                            <span>{item._contact.mobile}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <Amount
                    value={item.summary?.totalPOValue || 0}
                    decimalPlaces={2}
                    className="tw:text-sm tw:font-medium"
                  />
                </AppTable.Cell>
                <AppTable.Cell>
                  <span className="tw:flex tw:items-center tw:gap-1 tw:text-sm">
                    <MapPin size={12} className="tw:text-gray-500" />
                    {item._distance ?? "--"} km
                  </span>
                </AppTable.Cell>
                <AppTable.Cell>
                  <VendorBrandChip
                    sourceAllBrands={item.sourceAllBrands}
                    sourceableBrands={item.sourceableBrands}
                  />
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col tw:items-start tw:gap-1">
                    {item.summary?.pendingDeliveries > 0 &&
                      item.vendorType !== "OWN" && (
                        <AppBadge variant="warning">
                          <Truck size={14} className="tw:text-orange-800" />
                          <span className="tw:text-orange-800">
                            {item.summary?.pendingDeliveries || 0}{" "}
                            {t("pendingDeliveries")}
                          </span>
                        </AppBadge>
                      )}
                    {item.summary?.unpaidInvoices > 0 &&
                      item.vendorType !== "OWN" && (
                        <AppBadge variant="danger">
                          <CircleAlert size={14} className="tw:text-red-800" />
                          <span className="tw:text-red-800">
                            {item.summary?.unpaidInvoices || 0} {t("unpaid")}
                          </span>
                        </AppBadge>
                      )}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:justify-end tw:gap-2">
                    <AppButton
                      color="light"
                      fill="outline"
                      size="small"
                      onClick={() => callback({ action: "view", data: item })}
                    >
                      <Eye size={16} />
                      <span>{t("view")}</span>
                    </AppButton>
                    {item.vendorType !== "OWN" && (
                      <Rbac roles={rbacRoles.pay}>
                        {item.summary?.unpaidInvoices > 0 && (
                          <AppButton
                            color="primary"
                            fill="solid"
                            size="small"
                            onClick={() =>
                              callback({ action: "pay", data: item })
                            }
                          >
                            <IndianRupee size={16} />
                            <span>{t("pay")}</span>
                          </AppButton>
                        )}
                      </Rbac>
                    )}
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            ))
          )}
        </AppTable.Body>
      </AppTable>

      {hasMoreData && !loading && (
        <div className="tw:flex tw:justify-center tw:py-3">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={pagination.totalRecords}
            loadedCount={data.length}
          />
        </div>
      )}
    </>
  );
};

export default DesktopView;
