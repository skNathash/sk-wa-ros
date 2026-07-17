import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";

type Props = {
  id: string;
  name: string;
  image?: string;
  totalDeals?: number;
  selected?: boolean;
  callback?: (p: { action: string; data?: any }) => void;
};

const Item = ({ id, name, image, totalDeals, callback }: Props) => {
  const onView = () => {
    callback &&
      callback({
        action: "view",
        data: { categoryId: id, categoryName: name },
      });
  };

  return (
    <AppCard className="tw:overflow-hidden" noPadding>
      <div className="tw:flex tw:flex-col">
        <div className="tw:relative">
          <div className="tw:w-full tw:h-28 tw:bg-gray-100 tw:overflow-hidden">
            {image ? (
              <ImgRender
                assetId={image}
                alt={name}
                className="tw:w-full tw:h-full tw:object-cover tw:block"
                size="300"
              />
            ) : null}
          </div>
        </div>

        <div className="tw:p-3 tw:pt-3">
          <div className="tw:h-14 tw:flex tw:items-center">
            <div className="tw:text-sm tw:md:text-base tw:font-semibold tw:text-gray-900 tw:line-clamp-2">
              {name}
            </div>
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5 tw:line-clamp-2">
            {totalDeals || 0} deals
          </div>
          <div className="tw:mt-3 tw:flex tw:justify-center">
            <AppButton size="small" className="tw:w-full" onClick={onView}>
              View
            </AppButton>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default Item;
