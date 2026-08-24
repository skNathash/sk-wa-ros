import EntityThumb from "~/components/core/img/EntityThumb";

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
      className="tw:group tw:flex tw:w-full tw:cursor-pointer tw:flex-col tw:text-center focus:tw:outline-none"
    >
      {/* White category tile with the name inside — soft neutral border and a
          gentle shadow to match the shared marketplace card look. */}
      <div className="tw:flex tw:aspect-square tw:w-full tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-black/5 tw:bg-white tw:transition-all tw:duration-200 tw:group-hover:-translate-y-0.5 tw:group-hover:border-primary/30 tw:group-hover:shadow-md tw:group-active:scale-95 tw:group-focus-visible:ring-2 tw:group-focus-visible:ring-primary/50">
        <EntityThumb
          assetId={displayImg}
          name={label}
          fit="contain"
          boxClassName="tw:min-h-0 tw:flex-1 tw:w-full tw:p-2.5"
          imgClassName="tw:transition-transform tw:duration-200 tw:group-hover:scale-105"
          initialClassName="tw:text-lg"
        />
        <div className="tw:flex tw:h-6 tw:shrink-0 tw:items-center tw:justify-center tw:px-1 tw:pb-2">
          <span className="tw:line-clamp-1 tw:text-xs tw:font-semibold tw:leading-tight tw:text-gray-800 tw:transition-colors tw:group-hover:text-primary">
            {label}
          </span>
        </div>
      </div>
    </button>
  );
};

export default MenuItem;
