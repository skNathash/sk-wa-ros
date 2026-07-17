import { useTranslation } from "react-i18next";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";
import { AppTable, TableHeader } from "~/components/core/table";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import type { TableHeaderItem, ViewToggleType } from "~/types/CommonTypes";
import AppCard from "~/components/core/card/AppCard";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import { Check } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import CommonService from "~/services/CommonService";

interface DesktopViewProps {
  products: any[];
  loading: boolean;
  loadMore: () => void;
  hasMoreData: boolean;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  viewType: ViewToggleType;
  selectedIds: string[];
  disabled?: boolean;
  onToggle: (checked: boolean, product: any) => void;
  activeTab: string;
  onAddToCart: (product: any) => void;
  onAction?: (payload: { action: string; data?: any }) => void;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView = ({
  products,
  loading,
  loadMore,
  hasMoreData,
  loadingMore,
  totalCount,
  loadedCount,
  selectedIds,
  disabled = false,
  onToggle,
  activeTab,
  onAddToCart,
  onAction,
}: DesktopViewProps) => {
  const { t } = useTranslation(["common"]);

  const headers: TableHeaderItem[] = [
    { label: "", key: "select", width: "3%" },
    { label: t("item"), key: "product", width: "25%" },
    { label: t("stock"), key: "stock", width: "10%" },
    { label: t("mrp"), key: "mrp", width: "10%" },
  ];

  if (activeTab === "packaging") {
    headers.push({ label: t("sellingType"), key: "sellingType", width: "12%" });
  } else if (activeTab === "margin") {
    headers.push({ label: t("b2bPrice"), key: "b2bPrice", width: "12%" });
  }

  headers.push({ label: t("action"), key: "action", width: "8%" });

  if (loading) return <BusyLoader show={true} />;

  if (!loading && (!products || products.length === 0)) {
    return (
      <div className="tw:mt-4">
        <NoData />
      </div>
    );
  }

  return (
    <AppCard noPadding>
      <AppTable
        container
        responsive
        fixedLayout
        stickyHeader
        containerStyle={containerStyle}
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {products.map((product) => (
            <AppTable.Row
              key={product._id}
              className="tw:border-b hover:tw:bg-gray-50"
            >
              <AppTable.Cell>
                {!product.isUpdated ? (
                  <input
                    type="checkbox"
                    checked={selectedIds?.includes(product._id)}
                    disabled={disabled && !selectedIds?.includes(product._id)}
                    onChange={(e) => onToggle(e.target.checked, product)}
                    className="tw:w-4 tw:h-4 tw:cursor-pointer"
                  />
                ) : null}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-3">
                  <div className="tw:w-12 tw:h-12 tw:bg-gray-100 tw:rounded tw:overflow-hidden tw:shrink-0">
                    <ImgRender
                      assetId={product.images?.[0] || "placeholder.png"}
                      className="tw:w-full tw:h-full tw:object-cover"
                    />
                  </div>
                  <div>
                    <AppLink
                      asLink
                      href={`/dashboard/inventory/products/view/${product._id}`}
                      className="tw:font-medium tw:text-sm tw:text-blue-600 hover:tw:underline tw:line-clamp-2"
                    >
                      {product.name}
                    </AppLink>
                    <div className="tw:text-xs tw:text-gray-500">
                      ID: {product.id}
                    </div>
                  </div>
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-sm">
                <div
                  className={`tw:font-medium ${
                    product.actualMaxQty === 0
                      ? "tw:text-red-600"
                      : "tw:text-green-600"
                  }`}
                >
                  {product.actualMaxQty} {t("units")}
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-sm">
                <Amount value={product.mrp} />
              </AppTable.Cell>

              {activeTab === "packaging" && (
                <AppTable.Cell className="tw:text-sm">
                  <div className="tw:flex tw:flex-col">
                    <span className="tw:font-bold tw:text-slate-800">
                      {product.sellingType || t("unit")}
                    </span>
                    <span className="tw:text-xs tw:text-slate-500">
                      ({product.packageQty || 0} Units)
                    </span>
                  </div>
                </AppTable.Cell>
              )}

              {activeTab === "margin" && (
                <AppTable.Cell className="tw:text-sm">
                  <div className="tw:flex tw:flex-col tw:gap-1">
                    <div className="tw:font-semibold">
                      <Amount value={product.b2bPrice} />
                    </div>
                    {(product.b2bDiscount || 0) > 0 && (
                      <div className="tw:text-xs tw:text-gray-600">
                        Margin:{" "}
                        {CommonService.roundedByDecimalPlace(
                          product.b2bDiscount,
                          2,
                        )}
                        %
                      </div>
                    )}
                  </div>
                </AppTable.Cell>
              )}

              <AppTable.Cell>
                {!product.isUpdated ? (
                  <AppButton
                    size="small"
                    color="primary"
                    fill="outline"
                    onClick={() =>
                      onAction && onAction({ action: "update", data: product })
                    }
                  >
                    {t("update")}
                  </AppButton>
                ) : null}
              </AppTable.Cell>
            </AppTable.Row>
          ))}

          {hasMoreData && (
            <AppTable.Row>
              <AppTable.Cell
                colSpan={headers.length}
                className="tw:text-center"
              >
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={totalCount}
                  loadedCount={loadedCount}
                />
              </AppTable.Cell>
            </AppTable.Row>
          )}
        </AppTable.Body>
      </AppTable>
    </AppCard>
  );
};

export default DesktopView;
