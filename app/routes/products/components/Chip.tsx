import React from "react";

interface ChipProps {
  label: string;
  onRemove: () => void;
}

const Chip: React.FC<ChipProps> = ({ label, onRemove }) => {
  return (
    <div className="tw:flex tw:items-center tw:bg-gray-200 tw:rounded-full tw:px-3 tw:py-1 tw:text-sm tw:font-medium tw:text-gray-700">
      {label}
      <button
        className="tw:ml-2 tw:text-gray-500 hover:tw:text-gray-700"
        onClick={onRemove}
      >
        ✕
      </button>
    </div>
  );
};

export default Chip;
