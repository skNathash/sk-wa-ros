import { Star } from "lucide-react";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import {
  RATING_BARS,
  REVIEW_RECENT_LBL,
  REVIEW_SUMMARY,
  RUNNER_REVIEWS,
} from "./helper";

const STARS = [1, 2, 3, 4, 5];

/**
 * Reviews panel — the rating, what it is made of, and the words behind it. The
 * spread sits beside the figure rather than under it: a 4.9 built on two bad
 * drops is a different record from a 4.9 built on many middling ones.
 */
export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    allowNoSubscribe: true,
    allowIncompleteProfile: true,
  });
}

const RunnerProfileReviews = () => {
  return (
    <div className="runner-profile-panel">
      <div className="runner-profile-card">
        <div className="tw:flex tw:items-center tw:gap-5 tw:p-4">
          <div className="tw:shrink-0 tw:text-center">
            <p className="app-amount tw:text-4xl tw:font-bold tw:text-slate-900">
              {REVIEW_SUMMARY.rating}
            </p>
            <p className="tw:mt-1 tw:flex tw:justify-center tw:gap-0.5">
              {STARS.map((star) => (
                <Star
                  key={star}
                  size={13}
                  className="tw:fill-amber-400 tw:text-amber-400"
                />
              ))}
            </p>
            <p className="tw:mt-1 tw:text-[11px] tw:text-slate-400">
              {REVIEW_SUMMARY._countLbl}
            </p>
          </div>

          <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1.5">
            {RATING_BARS.map((bar) => (
              <div key={bar.stars} className="tw:flex tw:items-center tw:gap-2">
                <span className="tw:w-3 tw:text-[11px] tw:font-semibold tw:text-slate-500">
                  {bar.stars}
                </span>
                <Star size={10} className="tw:fill-amber-400 tw:text-amber-400" />
                <span className="runner-review-track">
                  <span
                    className="runner-review-fill"
                    style={{ width: `${bar.sharePct}%` }}
                  />
                </span>
                <span className="tw:w-8 tw:text-right tw:text-[11px] tw:text-slate-400">
                  {bar._shareLbl}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section>
        <p className="runner-profile-section-lbl">{REVIEW_RECENT_LBL}</p>

        <div className="runner-profile-card">
          {RUNNER_REVIEWS.map((review) => (
            <div key={review.id} className="runner-profile-row tw:items-start">
              <span
                className={`runner-chat-avatar runner-chat-avatar--sm ${review._avatarCls}`}
              >
                {review._avatarLbl}
              </span>

              <span className="tw:min-w-0 tw:flex-1">
                <span className="tw:flex tw:items-start tw:gap-2">
                  <span className="tw:min-w-0 tw:flex-1">
                    <span className="tw:block tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
                      {review._nameLbl}
                    </span>
                    <span className="tw:block tw:text-[11px] tw:font-semibold tw:text-primary">
                      {review._timeLbl}
                    </span>
                  </span>

                  <span className="tw:flex tw:shrink-0 tw:gap-0.5 tw:pt-0.5">
                    {STARS.map((star) => (
                      <Star
                        key={star}
                        size={11}
                        className={
                          star <= review.rating
                            ? "tw:fill-amber-400 tw:text-amber-400"
                            : "tw:fill-slate-200 tw:text-slate-200"
                        }
                      />
                    ))}
                  </span>
                </span>

                <span className="tw:mt-1.5 tw:block tw:text-sm tw:text-slate-600">
                  {review._textLbl}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RunnerProfileReviews;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Runner reviews"),
    },
  ];
}
