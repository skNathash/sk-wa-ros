import { Building2, Plus, ShoppingCart } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { useTranslation } from "react-i18next";

// Updated interface for LoadMoreButton support

interface ListViewProps {
  data: any[];
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
  callback: (data: { action: string; data: any }) => void;
}

const ListView = ({
  data,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
  callback,
}: ListViewProps) => {
  const { t } = useTranslation(["common"]);

  return (
    <>
      <div>
        {data.map((item) => (
          <AppCard key={item._id}>
            <div className="tw:flex tw:justify-between tw:items-center">
              <div className="tw:flex-1">
                <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
                  <Building2 size={14} />
                  <span className="tw:font-semibold">{item.vendor?.name}</span>
                </div>

                <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:md:grid-cols-4 tw:text-sm">
                  <div>
                    <span className="tw:text-gray-600 tw:mr-1">
                      {t("totalOrders")}
                    </span>
                    <span className="tw:text-gray-900 tw:font-medium">
                      {item.summary?.totalOrders}
                    </span>
                  </div>

                  <div>
                    <span className="tw:text-gray-600 tw:mr-1">
                      {t("totalQty")}
                    </span>
                    <span className="tw:text-gray-900 tw:font-medium">
                      {item.summary?.totalQuantity}
                    </span>
                  </div>

                  <div>
                    <span className="tw:text-gray-600 tw:mr-1">
                      {t("totalValue")}
                    </span>
                    <span className="tw:text-green-600 tw:font-medium">
                      <Amount value={item.summary?.totalValue} />
                    </span>
                  </div>

                  <div>
                    <span className="tw:text-gray-600 tw:mr-1">
                      {t("lastOrder")}
                    </span>
                    <span className="tw:text-gray-900 tw:font-medium">
                      {item.summary?.lastOrderDate ? (
                        <DateFormat
                          value={item.summary?.lastOrderDate}
                          formatStr="dd MMM yyyy"
                        />
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="tw:hidden tw:md:block">
                <AppButton
                  size="small"
                  color="primary"
                  onClick={() => callback({ action: "createPO", data: item })}
                >
                  <ShoppingCart />
                  {t("createPO")}
                </AppButton>
              </div>
            </div>

            <div className="tw:md:hidden tw:mt-4">
              <AppButton
                size="small"
                color="primary"
                className="tw:w-full"
                onClick={() => callback({ action: "createPO", data: item })}
              >
                <ShoppingCart />
                {t("createPO")}
              </AppButton>
            </div>
          </AppCard>
        ))}
      </div>
      {showLoadMore && data.length > 0 && (
        <LoadMoreButton
          loadMore={loadMore}
          loading={loadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
        />
      )}
    </>
  );
};

export default ListView;
