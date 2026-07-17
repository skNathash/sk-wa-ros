const MobileView = ({
  data,
  callback,
}: {
  data: Record<string, any>[];
  callback?: (a: { action: string; data: Record<string, any> }) => void;
}) => {
  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-2"></div>
    </>
  );
};

export default MobileView;
