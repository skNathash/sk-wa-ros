import ProductMobileViewItem from "./ProductMobileViewItem";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

const ProductMobileView = ({
  data,
  callback,
  loading,
}: {
  data: any[];
  callback?: (args: { action: string; data?: any }) => void;
  loading?: boolean;
}) => {
  if (loading)
    return (
      <div className="tw:flex tw:items-center tw:justify-center tw:py-4">
        <AppSpinner />
      </div>
    );

  if (!data || data.length === 0) return <NoData />;

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item, index) => (
        <ProductMobileViewItem key={index} row={item} callback={callback} />
      ))}
    </div>
  );
};

export default ProductMobileView;
