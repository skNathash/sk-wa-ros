import clsx from "clsx";
import { Store } from "lucide-react";
import { buildDetailFields, type Item } from "../helper";
import FieldValue from "./FieldValue";

type Props = {
  data: Partial<Item>;
  onImageClick?: (images: any[]) => void;
  /** header caption above the list; pass null to hide it */
  title?: string | null;
};

/** Read-only view of a single set of values — the retailer's submission. */
const ProductDetails = ({
  data,
  onImageClick,
  title = "Details you submitted",
}: Props) => {
  const fields = buildDetailFields(data);

  return (
    <div>
      {title ? (
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-semibold tw:tracking-wide tw:text-gray-500 tw:uppercase tw:mb-2">
          <Store size={12} />
          {title}
        </div>
      ) : null}

      <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:overflow-hidden">
        {/* gap-px over a gray background draws the separators — stays correct
            even when a full-width row breaks the two-column rhythm */}
        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-px tw:bg-gray-100">
          {fields.map((f) => (
            <div
              key={f.key}
              className={clsx(
                "tw:bg-white tw:px-3 tw:py-2.5",
                f.wide && "tw:sm:col-span-2"
              )}
            >
              <div className="tw:text-xs tw:font-medium tw:text-gray-500 tw:mb-0.5">
                {f.label}
              </div>
              <FieldValue
                value={f.submitted}
                type={f.type}
                onImageClick={onImageClick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
