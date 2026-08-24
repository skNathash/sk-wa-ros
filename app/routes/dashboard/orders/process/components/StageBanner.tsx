import Amount from "~/components/core/amount/Amount";

export type ProcessStage =
  | "placed"
  | "pick"
  | "pack"
  | "invoice"
  | "handover"
  | "delivered";

/** Maps an order status onto the fulfilment stage driving the page accent. */
export const getProcessStage = (
  status?: string,
): { stage: ProcessStage; label: string } => {
  switch (status) {
    case "Created":
    case "Confirmed":
    case "Picking":
      return { stage: "pick", label: "Currently Picking" };
    case "Packing":
      return { stage: "pack", label: "At the Packing Station" };
    case "Packed":
      return { stage: "invoice", label: "Ready to Invoice" };
    case "Invoiced":
    case "Ready to Ship":
      return { stage: "handover", label: "Ready for Handover" };
    case "Pending Shipment":
    case "Shipped":
    case "Seller Shipped":
    case "Partially Shipped":
      return { stage: "handover", label: "Out for Delivery" };
    case "Delivered":
    case "Partially Delivered":
      return { stage: "delivered", label: "Delivered" };
    default:
      return { stage: "placed", label: "Order Placed" };
  }
};

interface StageBannerProps {
  stage: ProcessStage;
  label: string;
  amount?: number;
  linesCount?: number;
  boxesCount?: number;
  /** Progress row (pick stage): fully-picked lines out of total lines. */
  progress?: { done: number; total: number; noun: string };
}

const StageBanner = ({
  stage,
  label,
  amount,
  linesCount = 0,
  boxesCount = 0,
  progress,
}: StageBannerProps) => {
  const meta = [
    `${linesCount} ${linesCount === 1 ? "Item" : "Items"}`,
    boxesCount > 0 ? `${boxesCount} ${boxesCount === 1 ? "box" : "boxes"}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={`op-banner op-stage-${stage}`}>
      <div className="op-eyebrow">{label}</div>
      <div className="tw:flex tw:items-end tw:justify-between tw:gap-2 tw:mt-1">
        <div className="op-banner-amount">
          <Amount value={amount || 0} decimalPlaces={0} />
        </div>
        <div className="op-banner-meta">{meta}</div>
      </div>
      {progress && progress.total > 0 && (
        <>
          <div className="op-progress-track">
            <div
              className="op-progress-fill"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((progress.done / progress.total) * 100),
                )}%`,
              }}
            />
          </div>
          <div className="op-progress-note">
            {progress.done} of {progress.total} {progress.noun}
          </div>
        </>
      )}
    </div>
  );
};

export default StageBanner;
