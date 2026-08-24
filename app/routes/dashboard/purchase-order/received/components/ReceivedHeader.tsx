import { Check, Download, MessageSquare } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";

type Props = {
  poDetails: Record<string, any>;
  onReceiptPdf: () => void;
  onSendToVendor: () => void;
};

/**
 * The closing banner of the receive flow — a plate in the store's own primary
 * so the screen reads as "this order is done" the moment it opens, with the
 * paperwork (invoice, box, closed-on) as one quiet meta line under the title.
 */
const ReceivedHeader = ({ poDetails, onReceiptPdf, onSendToVendor }: Props) => {
  const { t } = useTranslation();

  const vendorName =
    poDetails.vendorDetails?.name || poDetails.vendorInfo?.name || "-";

  const metaParts: ReactNode[] = [];

  if (poDetails._invoiceNumber) {
    metaParts.push(
      <span key="invoice">
        {t("invoice", { defaultValue: "Invoice" })} {poDetails._invoiceNumber}
      </span>,
    );
  }

  if (poDetails._packageId) {
    metaParts.push(
      <span key="box">
        {t("box", { defaultValue: "Box" })} {poDetails._packageId}
      </span>,
    );
  }

  if (poDetails._closedAt) {
    metaParts.push(
      <span key="closed">
        {t("closed", { defaultValue: "Closed" })}{" "}
        <DateFormat value={poDetails._closedAt} formatStr="dd MMM yyyy" />
        <span className="tw:mx-1 tw:opacity-60">·</span>
        <DateFormat value={poDetails._closedAt} formatStr="hh:mm a" />
      </span>,
    );
  }

  return (
    <div
      className="tw:mb-4 tw:rounded-xl tw:px-4 tw:py-4 tw:md:px-5"
      style={{
        /* The store's own primary, deepened on the left so the plate has some
           weight instead of reading as one flat slab of colour. */
        background:
          "linear-gradient(105deg, color-mix(in srgb, var(--primary) 78%, #000) 0%, var(--primary) 62%, color-mix(in srgb, var(--primary) 88%, #fff) 100%)",
      }}
    >
      <div className="tw:flex tw:flex-wrap tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:flex tw:min-w-0 tw:items-start tw:gap-3">
          <div className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-white/20">
            <Check className="tw:h-5 tw:w-5 tw:text-white" strokeWidth={2.5} />
          </div>

          <div className="tw:min-w-0">
            <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-white/70">
              {t("poClosed", { defaultValue: "PO Closed" })}
              {poDetails.orderId ? ` · ${poDetails.orderId}` : ""}
            </p>
            <h2 className="tw:mt-0.5 tw:truncate tw:text-xl tw:font-bold tw:leading-tight tw:text-white">
              {vendorName}
            </h2>

            {metaParts.length > 0 && (
              <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:items-center tw:text-xs tw:text-white/75">
                {metaParts.map((part, i) => (
                  <span key={i} className="tw:inline-flex tw:items-center">
                    {i > 0 && (
                      <span className="tw:mx-1.5 tw:opacity-60" aria-hidden>
                        ·
                      </span>
                    )}
                    {part}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2 tw:self-center">
          <AppButton
            size="small"
            fill="outline"
            color="light"
            onClick={onReceiptPdf}
            className="tw:bg-white/15! tw:text-white! tw:border-white/25! tw:hover:bg-white/25!"
          >
            <Download className="tw:h-3.5 tw:w-3.5" />
            {t("receiptPdf", { defaultValue: "Receipt PDF" })}
          </AppButton>

          <AppButton
            size="small"
            fill="outline"
            color="light"
            onClick={onSendToVendor}
            className="tw:bg-white/15! tw:text-white! tw:border-white/25! tw:hover:bg-white/25!"
          >
            <MessageSquare className="tw:h-3.5 tw:w-3.5" />
            {t("sendToVendor", { defaultValue: "Send to vendor" })}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default ReceivedHeader;
