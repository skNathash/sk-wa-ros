import AppBadge from "~/components/core/badge/AppBadge";

type Props = {
  totalProducts: number;
  validProducts: number;
  invalidProducts: number;
  subscribedProducts?: number;
};

const Summary = ({
  totalProducts,
  validProducts,
  invalidProducts,
  subscribedProducts = 0,
}: Props) => {
  return (
    <div className="tw:flex tw:flex-row tw:gap-4 tw:flex-wrap">
      <AppBadge variant="primary">Total: {totalProducts}</AppBadge>
      <AppBadge variant="success">Valid: {validProducts}</AppBadge>
      <AppBadge variant="danger">Not Found: {invalidProducts}</AppBadge>
      <AppBadge variant="light">
        Already Subscribed: {subscribedProducts}
      </AppBadge>
    </div>
  );
};

export default Summary;
