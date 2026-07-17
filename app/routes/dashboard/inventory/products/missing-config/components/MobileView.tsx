import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import type { ViewToggleType } from "~/types/CommonTypes";
import CommonService from "~/services/CommonService";

interface MobileViewProps {
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

const MobileView = ({
  products,
  loading,
  loadMore,
  hasMoreData,
  loadingMore,
  totalCount,
  loadedCount,
  selectedIds = [],
  disabled = false,
  onToggle,
  activeTab,
  onAddToCart,
  onAction,
}: MobileViewProps) => {
  const { t } = useTranslation(["common"]);

  if (loading) return <BusyLoader show={true} />;

  if (!loading && (!products || products.length === 0)) {
    return (
      <div className="tw:mt-4">
        <NoData />
      </div>
    );
  }

  const renderContent = () => {
    return (
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:gap-4">
        {products.map((product) => (
          <AppCard
            key={product._id}
            className="tw:flex tw:flex-col tw:relative tw:mb-0"
            noPadding
          >
            <div className="tw:p-2">
              <div className="tw:absolute tw:top-2 tw:left-2 tw:z-10">
                {!product.isUpdated ? (
                  <input
                    type="checkbox"
                    checked={selectedIds?.includes(product._id)}
                    disabled={disabled && !selectedIds?.includes(product._id)}
                    onChange={(e) => onToggle(e.target.checked, product)}
                    className="tw:w-5 tw:h-5 tw:cursor-pointer tw:shadow-sm"
                  />
                ) : null}
              </div>
              <div className="tw:w-full tw:aspect-square tw:bg-gray-100 tw:rounded tw:overflow-hidden tw:mb-3">
                <ImgRender
                  assetId={product.images?.[0]}
                  className="tw:w-full tw:h-full tw:object-cover"
                />
              </div>
              <div className="tw:flex-1">
                <div className="tw:font-medium tw:text-sm tw:line-clamp-2 tw:h-10">
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${product._id}`}
                  >
                    {product.name}
                  </AppLink>
                </div>
                <div className="tw:mt-2">
                  <div className="tw:flex tw:justify-between tw:items-start">
                    <div>
                      <div className="tw:text-[9px] tw:font-bold tw:text-slate-400 tw:uppercase tw:tracking-tight tw:mb-0.5">
                        {t("mrp")}
                      </div>
                      <div className="tw:text-sm tw:font-semibold">
                        <Amount value={product.mrp} />
                      </div>
                    </div>
                    <div className="tw:text-right">
                      <div className="tw:text-[9px] tw:font-bold tw:text-slate-400 tw:uppercase tw:tracking-tight tw:mb-0.5">
                        {t("stock")}
                      </div>
                      <div
                        className={`tw:text-xs tw:font-medium ${
                          product.actualMaxQty === 0
                            ? "tw:text-red-600"
                            : "tw:text-green-600"
                        }`}
                      >
                        {product.actualMaxQty} {t("units")}
                      </div>
                    </div>
                  </div>
                  {activeTab === "margin" && (
                    <div className="tw:mt-1 tw:flex tw:justify-between tw:items-start">
                      <div>
                        <div className="tw:text-[9px] tw:font-bold tw:text-slate-400 tw:uppercase tw:tracking-tight tw:mb-0.5">
                          {t("b2bPrice")}
                        </div>
                        <div className="tw:text-xs tw:font-semibold">
                          <Amount value={product.b2bPrice} />
                        </div>
                      </div>
                      {(product.b2bDiscount || 0) > 0 && (
                        <div className="tw:text-right">
                          <div className="tw:text-[9px] tw:font-bold tw:text-slate-400 tw:uppercase tw:tracking-tight tw:mb-0.5">
                            {t("margin")}
                          </div>
                          <div className="tw:text-xs tw:font-semibold tw:text-slate-700">
                            {CommonService.roundedByDecimalPlace(
                              product.b2bDiscount,
                              2,
                            )}
                            %
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === "packaging" && (
                    <div className="tw:mt-2">
                      <div className="tw:text-[9px] tw:font-bold tw:text-slate-400 tw:uppercase tw:tracking-tight tw:mb-0.5">
                        Sell In
                      </div>
                      <div className="tw:flex tw:flex-col">
                        <span className="tw:text-xs tw:font-bold tw:text-slate-800">
                          {product.sellingType || t("unit")}
                        </span>
                        <span className="tw:text-[10px] tw:font-medium tw:text-slate-500">
                          ({product.packageQty || 0} Units)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2">
                  {!product.isUpdated ? (
                    <AppButton
                      size="small"
                      color="primary"
                      fill="outline"
                      onClick={() =>
                        onAction &&
                        onAction({ action: "update", data: product })
                      }
                      className="tw-w-full"
                    >
                      {t("update")}
                    </AppButton>
                  ) : null}

                  {product.isInCart ? (
                    <div className="tw:w-full tw:flex tw:justify-center tw:py-1">
                      <Check className="tw:text-green-600" size={20} />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    );
  };

  return (
    <div className="tw:mt-4">
      {renderContent()}

      {hasMoreData && (
        <div className="tw:mt-6">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </div>
  );
};

export default MobileView;
