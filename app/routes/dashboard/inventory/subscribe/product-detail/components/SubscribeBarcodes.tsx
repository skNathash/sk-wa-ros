import { Barcode, Copy } from "lucide-react";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";

export interface SubscribeBarcodesProps {
  barcodes?: string[];
  /** Block heading. */
  title?: string;
  className?: string;
}

/**
 * "Barcodes" — every EAN the catalog carries for the product, as copy-to-
 * clipboard chips. Useful before subscribing: it's how the seller checks the
 * pack on their shelf is the pack StoreKing is selling.
 */
const SubscribeBarcodes = ({
  barcodes = [],
  title = "Barcodes",
  className,
}: SubscribeBarcodesProps) => {
  const appToast = useAppToast();

  const handleCopy = (code: string) => {
    CommonService.copyToClipboard(code);
    appToast.show({ msg: "Barcode copied", color: "success" });
  };

  return (
    <section className={className}>
      <h3 className="app-section-label tw:mb-2 tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        {title}
      </h3>

      {barcodes.length === 0 ? (
        <div className="tw:rounded-xl tw:border tw:border-dashed tw:border-slate-200 tw:bg-white tw:px-4 tw:py-6 tw:text-center tw:text-sm tw:text-slate-400">
          No barcodes on this product yet.
        </div>
      ) : (
        <div className="tw:flex tw:flex-wrap tw:gap-2">
          {barcodes.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => handleCopy(code)}
              title="Copy barcode"
              className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-slate-200 tw:bg-white tw:py-1.5 tw:pl-3 tw:pr-2.5 tw:text-sm tw:text-slate-700 tw:transition-colors tw:hover:border-primary tw:hover:bg-slate-50"
            >
              <Barcode size={15} className="tw:text-slate-400" />
              <span className="tw:font-semibold tw:tracking-wide">{code}</span>
              <Copy size={13} className="tw:text-slate-400" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default SubscribeBarcodes;
