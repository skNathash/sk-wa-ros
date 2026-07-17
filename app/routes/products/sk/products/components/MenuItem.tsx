import ImgRender from "~/components/core/img/ImgRender";

type MenuItemProps = {
  id: string;
  name: string;
  displayImg?: string;
  displayName?: string;
  onClick: () => void;
  variant?: "grid" | "slide";
};

const MenuItem = ({
  name,
  displayImg,
  displayName,
  onClick,
  variant = "grid",
}: MenuItemProps) => {
  const isGrid = variant === "grid";
  const imageSize = isGrid ? "tw:h-14" : "tw:h-16 tw:w-16";

  return (
    <div>
      <div
        className="tw:h-24 tw:bg-blue-50 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:overflow-hidden tw:cursor-pointer tw:p-1"
        onClick={onClick}
      >
        <ImgRender
          assetId={displayImg}
          alt={name}
          width={300}
          className="tw:w-full tw:h-full tw:object-cover"
        />
      </div>
      <div className="tw:text-xs tw:text-center tw:font-medium tw:line-clamp-2 tw:text-gray-700 tw:mt-2">
        {displayName || name}
      </div>
    </div>
  );
};

export default MenuItem;
