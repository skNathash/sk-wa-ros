import AppLink from "~/components/core/link/AppLink";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type { SellerDeal } from "~/types/CommonTypes";
import AppBadge from "~/components/core/badge/AppBadge";
import CaseOverrideNote from "~/shared/catalog/components/case-override-note/CaseOverrideNote";
import { Pencil } from "lucide-react";

type Props = {
  data: SellerDeal[];
  loading?: boolean;
  loadMore?: () => void;
  loadingMore?: boolean;
  totalCount?: number;
  loadedCount?: number;
  showLoadMore?: boolean;
  callback?: (args: { action: string; data: SellerDeal }) => void;
};

const headers = [
  { label: "", width: "5%" },
  { label: "Name", key: "name", width: "25%" },
  { label: "Case Qty", key: "caseQty", isCentered: true, width: "10%" },
  {
    label: "Inner Case Qty",
    key: "innerCaseQty",
    isCentered: true,
    width: "10%",
  },
  { label: "Sell In", key: "sellingType", isCentered: true, width: "10%" },
  { label: "In Stock", key: "inStock", isCentered: true, width: "10%" },
  { label: "Action", key: "action", isCentered: true, width: "10%" },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView = ({
  data,
  loading = false,
  loadMore,
  loadingMore = false,
  totalCount = 0,
  loadedCount = 0,
  showLoadMore = false,
  callback,
}: Props) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <div>
      <AppTable
        container
        responsive
        containerStyle={containerStyle}
        stickyHeader
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>

        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={12} />
          ) : data.length === 0 ? (
            <AppTable.Row>
              <AppTable.Cell colSpan={headers.length}>
                <NoData />
              </AppTable.Cell>
            </AppTable.Row>
          ) : (
            data.map((item: SellerDeal, index: number) => (
              <AppTable.Row
                key={`${item._id}-${index}`}
                className="tw:hover:bg-gray-50"
              >
                <AppTable.Cell className="tw:text-center">
                  <div className="tw:w-14 tw:h-14 tw:bg-gray-200 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <ImgRender
                        assetId={item.images[0]}
                        className="tw:w-full tw:h-full tw:object-cover tw:rounded-lg"
                        alt={item.name}
                      />
                    ) : (
                      <div className="tw:w-6 tw:h-6 tw:bg-gray-300"></div>
                    )}
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  <AppLink
                    href={`/dashboard/inventory/products/view/${item._id}`}
                    asLink
                    title={item.name}
                    className="tw:mb-1 tw:block"
                  >
                    <div className="tw:font-medium tw:line-clamp-2">
                      {item.name}
                    </div>
                  </AppLink>
                  <div className="tw:text-gray-500 tw:text-xs">
                    <span>ID: {item.id}</span>
                  </div>
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-center">
                  <span className="tw:inline-flex tw:items-center tw:gap-1">
                    {item.caseQty ?? "-"}
                    <span className="tw:text-gray-500 tw:text-xs">units</span>
                    {item.overrideCaseQtyOnLowStock && <CaseOverrideNote />}
                  </span>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <span className="tw:inline-flex tw:items-center tw:gap-1">
                    {item.innerCaseQty ?? "-"}{" "}
                    <span className="tw:text-gray-500 tw:text-xs">units</span>
                    {item.overrideInnerCaseQtyOnLowStock && (
                      <CaseOverrideNote />
                    )}
                  </span>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <AppBadge variant={item.sellingTypeColor || "light"}>
                    {item.sellingType ?? "-"}
                  </AppBadge>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  {item.actualMaxQty ?? "-"}{" "}
                  <span className="tw:text-gray-500 tw:text-xs">units</span>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <AppButton
                    size="small"
                    fill="outline"
                    color="primary"
                    onClick={() => callback?.({ action: "edit", data: item })}
                  >
                    <Pencil />
                    Edit
                  </AppButton>
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
                  loadMore={loadMore!}
                  loading={loadingMore}
                  totalCount={totalCount}
                  loadedCount={loadedCount}
                />
              </AppTable.Cell>
            </AppTable.Row>
          )}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
