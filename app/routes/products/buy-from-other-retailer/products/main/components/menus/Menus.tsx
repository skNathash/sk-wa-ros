import ImgRender from "~/components/core/img/ImgRender";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

type Menu = {
  name: string;
  _id: string;
  _displayImg: string;
  _displayName: string;
};

type Props = {
  menus: Menu[];
  loading: boolean;
  onMenuClick?: (menu: Menu) => void;
};

const Menus = ({ menus, loading, onMenuClick }: Props) => {
  if (loading) {
    return (
      <div className="tw:mt-4 tw:mb-4 tw:flex tw:justify-center">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-4 tw:md:grid-cols-7 tw:lg:grid-cols-8 tw:gap-x-2 tw:gap-y-4 tw:bg-white tw:p-4 tw:rounded-xl tw:shadow-sm">
      {menus.map((menu) => (
        <div
          key={menu._id}
          className="tw:flex tw:flex-col tw:items-center tw:gap-1.5 tw:cursor-pointer tw:transition-transform tw:active:scale-95"
          onClick={() => onMenuClick?.(menu)}
        >
          <div className="tw:w-14 tw:h-14 tw:sm:w-16 tw:sm:h-16 tw:rounded-full tw:bg-slate-50 tw:border tw:border-slate-100 tw:flex tw:items-center tw:justify-center tw:overflow-hidden tw:p-2 tw:shadow-sm">
            <ImgRender
              assetId={menu._displayImg}
              alt={menu._displayName}
              className="tw:w-full tw:h-full tw:object-contain"
            />
          </div>
          <p className="tw:text-center tw:text-[10px] tw:sm:text-xs tw:font-bold tw:text-slate-800 tw:line-clamp-2 tw:leading-tight">
            {menu._displayName}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Menus;
