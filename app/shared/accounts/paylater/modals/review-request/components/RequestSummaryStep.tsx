import Amount from "~/components/core/amount/Amount";
import type { BuyerStory } from "../helper";

type Props = {
  request: any;
  story: BuyerStory;
};

const Tile = ({
  label,
  value,
  caption,
  className,
}: {
  label: string;
  value: React.ReactNode;
  caption: string;
  className: string;
}) => (
  <div className={`tw:rounded-lg tw:border tw:p-2.5 ${className}`}>
    <div className="tw:text-[10px] tw:font-bold tw:tracking-wide tw:opacity-70">
      {label}
    </div>
    <div className="tw:mt-1 tw:text-base tw:font-bold tw:text-gray-900">
      {value}
    </div>
    <div className="tw:text-[10px] tw:text-gray-500">{caption}</div>
  </div>
);

/** Step 1 — the ask itself, then the trading history that backs it. */
const RequestSummaryStep = ({ request, story }: Props) => {
  const askedLimit = Number(request?.creditLimit) || 0;

  return (
    <div className="tw:space-y-4">
      <section>
        <h3 className="tw:mb-2 tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-gray-400">
          WHAT THEY ASKED FOR
        </h3>
        <div className="tw:rounded-lg tw:border tw:border-blue-200 tw:bg-blue-50 tw:p-3">
          <div className="tw:flex tw:divide-x tw:divide-blue-200">
            <div className="tw:pr-4">
              <div className="tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-blue-700">
                CREDIT LIMIT
              </div>
              <div className="tw:mt-0.5 tw:text-xl tw:font-bold tw:text-gray-900">
                <Amount value={askedLimit} decimalPlaces={0} />
              </div>
            </div>
            <div className="tw:pl-4">
              <div className="tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-blue-700">
                TENURE
              </div>
              <div className="tw:mt-0.5 tw:text-xl tw:font-bold tw:text-gray-900">
                {request?.validityPeriod || "—"}
              </div>
            </div>
          </div>

          {request?.reason && (
            <div className="tw:mt-3 tw:rounded-md tw:border tw:border-blue-100 tw:bg-white tw:p-2.5">
              <div className="tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-gray-400">
                REASON
              </div>
              <p className="tw:mt-1 tw:text-xs tw:italic tw:text-gray-700">
                &ldquo;{request.reason}&rdquo;
              </p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-gray-400">
          THEIR STORY WITH YOU
        </h3>
        <p className="tw:mb-2 tw:text-xs tw:text-gray-500">
          Everything you&apos;ve done together so far
        </p>

        {story.hasHistory ? (
          <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:sm:grid-cols-4">
            <Tile
              label="ORDERS"
              value={story.orders}
              caption="in 6mo"
              className="tw:border-blue-200 tw:bg-blue-50 tw:text-blue-700"
            />
            <Tile
              label="SPENT"
              value={<Amount value={story.spent} decimalPlaces={0} />}
              caption="with you"
              className="tw:border-emerald-200 tw:bg-emerald-50 tw:text-emerald-700"
            />
            <Tile
              label="FILL RATE"
              value={story.fillRate !== null ? `${story.fillRate}%` : "—"}
              caption="delivered"
              className="tw:border-violet-200 tw:bg-violet-50 tw:text-violet-700"
            />
            <Tile
              label="AVG TICKET"
              value={<Amount value={story.avgTicket} decimalPlaces={0} />}
              caption="per order"
              className="tw:border-amber-200 tw:bg-amber-50 tw:text-amber-700"
            />
          </div>
        ) : (
          <div className="tw:rounded-lg tw:border tw:border-dashed tw:border-gray-300 tw:bg-gray-50 tw:p-4 tw:text-center">
            <p className="tw:text-xs tw:font-medium tw:text-gray-600">
              No orders with you in the last 6 months
            </p>
            <p className="tw:mt-1 tw:text-[11px] tw:text-gray-500">
              This is a first-time credit relationship — lean on the KYC and
              trust signals in the next step.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default RequestSummaryStep;
