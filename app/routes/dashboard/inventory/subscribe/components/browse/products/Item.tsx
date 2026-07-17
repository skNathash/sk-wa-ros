import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import { Box } from "lucide-react";
import AuthService from "~/services/AuthService";

const Item = ({
  data,
  index,
  callback,
  isSelected = false,
  onSelectionChange,
}: {
  data: any;
  index: number;
  callback: (params: { action: string; data?: any }) => void;
  isSelected?: boolean;
  onSelectionChange?: (productId: string, selected: boolean) => void;
}) => {
  const handleSubscribe = () => {
    callback({ action: "subscribe", data: { index } });
  };

  const handleView = () => {
    callback({ action: "view", data: { _id: data._id } });
  };

  const handleRemove = () => {
    callback({ action: "remove", data: { index } });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectionChange) {
      onSelectionChange(data._id, e.target.checked);
    }
  };

  return (
    <div className="tw:bg-white tw:rounded-lg tw:p-4 tw:flex tw:flex-col tw:gap-1 tw:border tw:border-gray-200 tw:relative">
      {!data.isInCart && (
        <input
          type="checkbox"
          className="tw:w-4 tw:h-4 tw:rounded-md tw:border tw:border-gray-300 tw:absolute tw:top-2 tw:left-2 tw:z-10"
          checked={isSelected}
          onChange={handleCheckboxChange}
        />
      )}
      <div
        className="tw:flex tw:justify-center tw:mb-2 tw:group tw:cursor-pointer"
        onClick={handleView}
      >
        {data.images && data.images.length > 0 ? (
          <ImgRender
            assetId={data.images[0]}
            alt={data.name}
            className="tw:w-full tw:h-28 tw:object-contain tw:rounded-md"
          />
        ) : (
          <div className="tw:w-full tw:h-28 tw:flex tw:items-center tw:justify-center tw:rounded-md">
            <Box size={36} className="tw:text-gray-400" />
          </div>
        )}
      </div>
      <div
        className="tw:font-semibold tw:text-sm tw:mt-1 tw:tw:truncate tw:w-full tw:h-12 tw:cursor-pointer"
        onClick={handleView}
      >
        <div className="tw:font-semibold tw:text-sm tw:line-clamp-2">
          {data.name}
        </div>
      </div>
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
        <Amount
          value={Number(data.mrp)}
          className="tw:text-base tw:font-bold tw:text-green-700"
        />
      </div>
      <div className="tw:text-xs tw:text-gray-400 tw:mb-1">
        ID: {data.dealId}
      </div>
      <div>
        <>
          {data.isInCart ? (
            <AppButton
              size="small"
              color="danger"
              fill="outline"
              onClick={handleRemove}
              className="tw:w-full tw:mt-2"
              noShadow={true}
            >
              Remove
            </AppButton>
          ) : (
            <AppButton
              size="small"
              onClick={handleSubscribe}
              className="tw:w-full tw:mt-2"
              noShadow={true}
            >
              Subscribe
            </AppButton>
          )}
        </>
      </div>
    </div>
  );
};

export default Item;
