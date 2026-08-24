import { Plus, Trash2 } from "lucide-react";

// One editable custom-field row. Rows are kept as an ordered array (rather than
// an object) so keys can be typed freely and duplicates edited without React
// remounting inputs; the array is folded into a `customFields` object on submit.
export interface CustomFieldRow {
  key: string;
  value: string;
}

interface CustomFieldsInputProps {
  rows: CustomFieldRow[];
  onChange: (rows: CustomFieldRow[]) => void;
  disabled?: boolean;
}

// Fold the editable rows into the `customFields` object the API expects,
// dropping blank keys and trimming both sides. Later rows win on a key clash.
export const toCustomFields = (
  rows: CustomFieldRow[],
): Record<string, string> => {
  const out: Record<string, string> = {};
  rows.forEach(({ key, value }) => {
    const k = key.trim();
    if (k) out[k] = value.trim();
  });
  return out;
};

// Seed editable rows from an existing `customFields` object (e.g. when editing).
export const fromCustomFields = (
  fields?: Record<string, any> | null,
): CustomFieldRow[] =>
  fields
    ? Object.entries(fields).map(([key, value]) => ({
        key,
        value: value == null ? "" : String(value),
      }))
    : [];

const CustomFieldsInput = ({
  rows,
  onChange,
  disabled,
}: CustomFieldsInputProps) => {
  const updateRow = (index: number, patch: Partial<CustomFieldRow>) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => onChange([...rows, { key: "", value: "" }]);

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      {rows.map((row, index) => (
        <div key={index} className="tw:flex tw:items-center tw:gap-2">
          <input
            type="text"
            placeholder="Field name"
            value={row.key}
            disabled={disabled}
            onChange={(e) => updateRow(index, { key: e.target.value })}
            className="tw:w-2/5 tw:rounded-md tw:border tw:border-gray-300 tw:bg-white tw:px-2 tw:py-1.5 tw:text-sm tw:outline-none tw:placeholder:text-sm tw:disabled:bg-gray-100"
          />
          <input
            type="text"
            placeholder="Value"
            value={row.value}
            disabled={disabled}
            onChange={(e) => updateRow(index, { value: e.target.value })}
            className="tw:flex-1 tw:rounded-md tw:border tw:border-gray-300 tw:bg-white tw:px-2 tw:py-1.5 tw:text-sm tw:outline-none tw:placeholder:text-sm tw:disabled:bg-gray-100"
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            disabled={disabled}
            aria-label="Remove field"
            className="tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:text-gray-400 hover:tw:bg-rose-50 hover:tw:text-rose-500 tw:disabled:opacity-50"
          >
            <Trash2 className="tw:h-4 tw:w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        disabled={disabled}
        className="tw:flex tw:w-fit tw:items-center tw:gap-1 tw:rounded-md tw:border tw:border-dashed tw:border-gray-300 tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-medium tw:text-gray-600 hover:tw:border-gray-400 hover:tw:bg-gray-50 tw:disabled:opacity-50"
      >
        <Plus className="tw:h-3.5 tw:w-3.5" />
        Add field
      </button>
    </div>
  );
};

export default CustomFieldsInput;
