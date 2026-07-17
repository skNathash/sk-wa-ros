export type UploadMode = "detailed" | "dealId";

interface UploadModeOption {
  key: UploadMode;
  label: string;
  desc: string;
}

const OPTIONS: UploadModeOption[] = [
  {
    key: "detailed",
    label: "Detailed Upload",
    desc: "Product Name, Barcode, MRP, Purchase Price, Quantity, Unit Type, Description, Brand, Category.",
  },
  {
    key: "dealId",
    label: "Only DealId Upload",
    desc: "Upload a file with deal IDs only.",
  },
];

interface UploadModeSelectorProps {
  value: UploadMode;
  onChange: (mode: UploadMode) => void;
}

const UploadModeSelector = ({ value, onChange }: UploadModeSelectorProps) => {
  return (
    <div
      role="radiogroup"
      aria-label="Upload mode"
      className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-2 tw:mb-4"
    >
      {OPTIONS.map((opt) => {
        const selected = value === opt.key;
        return (
          <label
            key={opt.key}
            className={`tw:relative tw:flex tw:items-start tw:gap-2.5 tw:px-3 tw:py-2.5 tw:rounded-md tw:border tw:cursor-pointer tw:transition-colors tw:select-none ${
              selected
                ? "tw:border-primary tw:bg-primary/5"
                : "tw:border-gray-200 tw:bg-white tw:hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="upload-mode"
              value={opt.key}
              checked={selected}
              onChange={() => onChange(opt.key)}
              className="tw:sr-only"
            />
            <span
              aria-hidden="true"
              className={`tw:mt-0.5 tw:flex tw:h-4 tw:w-4 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border-2 tw:transition-colors ${
                selected ? "tw:border-primary" : "tw:border-gray-300"
              }`}
            >
              {selected && (
                <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-primary" />
              )}
            </span>
            <span className="tw:flex tw:flex-col tw:min-w-0">
              <span
                className={`tw:text-sm tw:font-medium tw:leading-tight ${
                  selected ? "tw:text-primary" : "tw:text-gray-800"
                }`}
              >
                {opt.label}
              </span>
              <span className="tw:text-[11px] tw:text-gray-500 tw:leading-snug tw:mt-0.5">
                {opt.desc}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default UploadModeSelector;
