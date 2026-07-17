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
}: MenuItemProps) => {
  const label = displayName || name;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="tw:group tw:flex tw:w-full tw:cursor-pointer tw:flex-col tw:items-center tw:gap-2 tw:text-center focus:tw:outline-none"
    >
      {/* Theme-tinted category tile — surface + border derive from --primary so
          it reads correctly in every theme instead of a fixed blue. */}
      <div className="tw:relative tw:flex tw:aspect-square tw:w-full tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-2xl tw:border tw:border-primary/10 tw:bg-primary/[0.06] tw:p-2.5 tw:transition-all tw:duration-200 tw:group-hover:-translate-y-0.5 tw:group-hover:border-primary/40 tw:group-hover:bg-primary/10 tw:group-hover:shadow-md tw:group-active:scale-95 tw:group-focus-visible:ring-2 tw:group-focus-visible:ring-primary/50">
        <ImgRender
          assetId={displayImg}
          alt={name}
          width={300}
          className="tw:h-full tw:w-full tw:object-contain tw:transition-transform tw:duration-200 tw:group-hover:scale-105"
        />
      </div>
      <span className="tw:line-clamp-2 tw:text-xs tw:font-medium tw:leading-tight tw:text-gray-700 tw:transition-colors tw:group-hover:text-primary">
        {label}
      </span>
    </button>
  );
};

export default MenuItem;
