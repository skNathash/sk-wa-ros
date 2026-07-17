import clsx from "clsx";
import AppButton from "../button/AppButton";
import { useTranslation } from "react-i18next";
import useInfiniteScroll from "react-infinite-scroll-hook";
import AppSpinner from "../Spinner/AppSpinner";

const LoadMoreButton = ({
  loadMore,
  loading,
  totalCount,
  loadedCount,
  noMargin = false,
  loaderType = "infinite-scroll",
}: {
  loadMore: () => void;
  loading: boolean;
  totalCount: number;
  loadedCount: number;
  noMargin?: boolean;
  loaderType?: "button" | "infinite-scroll";
}) => {
  const { t } = useTranslation(["common"]);

  const [infiniteRef] = useInfiniteScroll({
    loading,
    hasNextPage: loadedCount < totalCount,
    onLoadMore: loadMore,
    disabled: false,
    rootMargin: "0px 0px 400px 0px",
  });

  if (loaderType === "infinite-scroll") {
    return (
      <div ref={infiniteRef} className="tw:flex tw:justify-center tw:mt-6">
        {loading ? (
          <AppSpinner />
        ) : (
          <div className="tw:md:text-xs tw:text-sm tw:text-gray-500">
            {t("loaded")} {loadedCount} / {totalCount}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx("tw:flex tw:justify-center tw:mt-6", {
        "tw:mt-0": noMargin,
      })}
    >
      <AppButton
        fill="outline"
        color="light"
        size="small"
        onClick={loadMore}
        isLoading={loading}
      >
        {loading
          ? t("loading")
          : `${t("loadMore")} ${loadedCount}/${totalCount}`}
      </AppButton>
    </div>
  );
};

export default LoadMoreButton;
