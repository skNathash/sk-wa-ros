const SellingTypeDisplay = ({ sellingType }: { sellingType?: string }) => {
  if (!sellingType) return null;
  return <>{sellingType.replace(/_/g, " ")}</>;
};

export default SellingTypeDisplay;
