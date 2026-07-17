import { SortAsc, SortDesc } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

interface Props {
  callback: (sortType: string) => void;
}

const MrpSort = ({ callback }: Props) => {
  const { control, setValue } = useFormContext();
  const sortType = useWatch({ control, name: "sortType" });

  const handleSortTypeChange = () => {
    setValue(
      "sortType",
      sortType === "mrp-low-to-high" ? "mrp-high-to-low" : "mrp-low-to-high"
    );

    callback(sortType);
  };

  return (
    <div>
      <button
        className="tw:cursor-pointer tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-blue-600"
        onClick={handleSortTypeChange}
      >
        {sortType === "mrp-low-to-high" ? (
          <SortAsc size={16} />
        ) : (
          <SortDesc size={16} />
        )}
        Price
      </button>
    </div>
  );
};

export default MrpSort;
