import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import Amount from "~/components/core/amount/Amount";
import {
  getBuyerPanelHeading,
  getDistanceKm,
  type ActiveCreditsElsewhere,
  type BuyerStory,
  type ReviewDocument,
  type TrustScore,
} from "../helper";

type Props = {
  request: any;
  story: BuyerStory;
  credits: ActiveCreditsElsewhere;
  trust: TrustScore;
  documents: ReviewDocument[];
  /** Phones get the same panel folded into a single expandable strip. */
  collapsible?: boolean;
};

const TONE_CLASS: Record<TrustScore["tone"], string> = {
  success: "tw:bg-blue-50 tw:border-blue-200 tw:text-blue-900",
  warning: "tw:bg-amber-50 tw:border-amber-200 tw:text-amber-900",
  danger: "tw:bg-red-50 tw:border-red-200 tw:text-red-900",
};

const Row = ({
  label,
  children,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) => (
  <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-2 tw:border-b tw:border-dashed tw:border-gray-200 tw:last:border-b-0">
    <span className="tw:text-xs tw:text-gray-500">{label}</span>
    <span
      className={clsx(
        "tw:text-xs tw:font-semibold tw:text-gray-900 tw:text-right",
        valueClassName,
      )}
    >
      {children}
    </span>
  </div>
);

/**
 * Everything known about the buyer, held beside the decision on every step so
 * the seller never has to leave the flow to check who they are lending to.
 */
const BuyerPanel = ({
  request,
  story,
  credits,
  trust,
  documents,
  collapsible = false,
}: Props) => {
  const [expanded, setExpanded] = useState(!collapsible);

  const user = request?.userInfo || {};
  const initials = (user.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join("");

  const place = user.address?.city || user.address?.district || "";
  const distanceKm = getDistanceKm(request);

  const identity = (
    <div className="tw:flex tw:items-center tw:gap-2.5">
      <div className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-blue-600 tw:text-sm tw:font-bold tw:text-white">
        {initials || "?"}
      </div>
      <div className="tw:min-w-0">
        <div className="tw:truncate tw:text-sm tw:font-bold tw:text-gray-900">
          {user.name || "Buyer"}
        </div>
        {place && (
          <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
            · {place}
          </div>
        )}
      </div>
    </div>
  );

  const scoreCard = (
    <div
      className={clsx(
        "tw:rounded-lg tw:border tw:px-3 tw:py-2.5",
        TONE_CLASS[trust.tone],
      )}
    >
      <div className="tw:flex tw:items-baseline tw:gap-1">
        <span className="tw:text-2xl tw:font-bold tw:leading-none">
          {trust.score}
        </span>
        <span className="tw:text-xs tw:opacity-70">/100</span>
      </div>
      {trust.label && (
        <div className="tw:mt-1 tw:text-[11px] tw:font-medium tw:opacity-80">
          {trust.label}
        </div>
      )}
    </div>
  );

  return (
    <aside className="tw:rounded-lg tw:border tw:border-gray-200 tw:bg-gray-50 tw:p-3 tw:lg:border-0 tw:lg:rounded-none tw:lg:bg-gray-50 tw:lg:p-4">
      <div className="tw:mb-2 tw:hidden tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-gray-400 tw:lg:block">
        {getBuyerPanelHeading(request)}
      </div>

      {/* The fold is a phone affordance only — there is room for the whole
          panel beside the step once the rail appears. */}
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-3 tw:cursor-pointer tw:lg:hidden"
        >
          {identity}
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className="tw:text-sm tw:font-bold tw:text-gray-900">
              {trust.score}
              <span className="tw:text-[10px] tw:font-normal tw:text-gray-500">
                /100
              </span>
            </span>
            <ChevronDown
              size={16}
              className={clsx(
                "tw:text-gray-500 tw:transition-transform",
                expanded && "tw:rotate-180",
              )}
            />
          </div>
        </button>
      )}

      <div className={clsx(collapsible && "tw:hidden tw:lg:block")}>
        {identity}
        <div className="tw:mt-3">{scoreCard}</div>
      </div>

      <div
        className={clsx(
          collapsible && "tw:mt-3",
          collapsible && !expanded && "tw:hidden tw:lg:block",
        )}
      >
        {collapsible && <div className="tw:mb-3 tw:lg:hidden">{scoreCard}</div>}

        <div className="tw:rounded-lg tw:bg-white tw:px-3 tw:py-1 tw:lg:bg-transparent tw:lg:px-0">
          <Row label="Orders from you (6mo)">
            {story.hasHistory ? `${story.orders} orders` : "No orders yet"}
          </Row>
          <Row label="Spent with you">
            <Amount value={story.spent} decimalPlaces={0} />
          </Row>
          {story.fillRate !== null && (
            <Row
              label="Fill rate"
              valueClassName={
                story.fillRate >= 90 ? "tw:text-emerald-600" : undefined
              }
            >
              {story.fillRate}%
            </Row>
          )}
          <Row label="Avg cart size">
            <Amount value={story.avgTicket} decimalPlaces={0} />
          </Row>
          {distanceKm !== null && (
            <Row label="Distance">{distanceKm.toFixed(1)} km</Row>
          )}
          {credits.onTimeRate !== null && (
            <Row
              label="On-time (other sellers)"
              valueClassName={
                credits.onTimeRate >= 90 ? "tw:text-emerald-600" : undefined
              }
            >
              {credits.onTimeRate}%
            </Row>
          )}
          <Row label="Active credit elsewhere">
            {credits.sellerCount ? (
              <>
                <Amount value={credits.totalLimit} decimalPlaces={0} /> /{" "}
                {credits.sellerCount}{" "}
                {credits.sellerCount === 1 ? "seller" : "sellers"}
              </>
            ) : (
              "None"
            )}
          </Row>
          {credits.outstanding > 0 && (
            <Row label="Outstanding elsewhere">
              <Amount value={credits.outstanding} decimalPlaces={0} />
            </Row>
          )}
          {credits.overdueCount > 0 && (
            <Row label="Overdue elsewhere" valueClassName="tw:text-red-600">
              {credits.overdueCount}{" "}
              {credits.overdueCount === 1 ? "wallet" : "wallets"}
            </Row>
          )}
        </div>

        <div className="tw:mt-3 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:p-3">
          <div className="tw:mb-2 tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-gray-400">
            FIELD VERIFIED
          </div>
          {documents.length ? (
            <ul className="tw:space-y-1">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="tw:flex tw:items-start tw:gap-1.5 tw:text-[11px] tw:text-gray-700"
                >
                  <Check
                    size={12}
                    className="tw:mt-0.5 tw:shrink-0 tw:text-emerald-600"
                  />
                  <span className="tw:min-w-0 tw:truncate">
                    {doc.title}
                    {doc.refNo ? ` · ${doc.refNo}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tw:text-[11px] tw:text-gray-400">
              No documents submitted with this request.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

export default BuyerPanel;
