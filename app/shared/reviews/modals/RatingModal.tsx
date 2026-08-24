import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  franchiseId?: string;
  orderId?: string;
  orderNumber?: string;
  sellerName?: string;
  title?: string;
};

type FormValues = {
  comment: string;
};

const STARS = [1, 2, 3, 4, 5];

const STAR_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

const RatingModal = ({
  show,
  callback,
  franchiseId,
  orderId,
  orderNumber,
  sellerName,
  title,
}: Props) => {
  const appToast = useAppToast();
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      comment: "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (show) {
      reset({
        comment: "",
      });
      setRating(0);
      setSubmitting(false);
      setRatingError("");
    }
  }, [show, reset]);

  const close = () => callback({ action: "close" });

  const onSubmit = handleSubmit(async (values) => {
    if (!rating) {
      setRatingError("Please select a rating");
      return;
    }

    const comment = values.comment?.trim();

    if (!comment) {
      appToast.show({
        msg: "Please provide a comment",
        color: "error",
      });
      return;
    }

    const payload: Record<string, any> = {
      rating,
    };

    if (franchiseId) payload.franchiseId = franchiseId;
    if (orderId) payload.orderId = orderId;
    if (orderNumber) payload.orderNumber = orderNumber;

    const reviewTitle = title?.trim();

    if (reviewTitle) payload.title = reviewTitle;
    payload.comment = comment;

    setSubmitting(true);
    try {
      const res = await FranchiseService.submitFranchiseReview(payload);
      if (res.statusCode === 200 || res.statusCode === 201) {
        appToast.show({
          msg: "Review submitted successfully",
          color: "success",
        });
        callback({ action: "submitted", data: payload });
      } else {
        appToast.show({
          msg: res.data?.message || "Failed to submit review",
          color: "error",
        });
      }
    } catch {
      appToast.show({
        msg: "Something went wrong. Please try again.",
        color: "error",
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <AppModal show={show} callback={callback} className="tw:max-w-md">
      <AppModal.Title onClose={close}>Rate your experience</AppModal.Title>

      <form id="rating-review-form" onSubmit={onSubmit}>
        <AppModal.Content className="tw:max-h-[75vh]">
          <div className="tw:space-y-4">
            {(sellerName || orderNumber || orderId) && (
              <div className="tw:rounded-xl tw:border tw:border-gray-100 tw:bg-gray-50 tw:px-3.5 tw:py-2.5">
                {sellerName && (
                  <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                    {sellerName}
                  </div>
                )}
                {(orderNumber || orderId) && (
                  <div className="tw:mt-0.5 tw:text-xs tw:text-gray-500">
                    Order #{orderNumber || orderId}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="tw:mb-1.5 tw:block tw:text-xs tw:font-semibold tw:text-gray-600">
                Rating
              </label>
              <div className="tw:flex tw:items-center tw:gap-1">
                {STARS.map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      setRatingError("");
                    }}
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    aria-pressed={star <= rating}
                    className="tw:cursor-pointer tw:rounded-lg tw:p-1 tw:transition-transform hover:tw:scale-110 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-amber-300"
                  >
                    <Star
                      size={30}
                      strokeWidth={1.5}
                      className={
                        star <= rating
                          ? "tw:fill-amber-400 tw:text-amber-400"
                          : "tw:text-gray-300"
                      }
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <div className="tw:mt-1.5 tw:text-xs tw:font-medium tw:text-amber-600">
                  {STAR_LABELS[rating]}
                </div>
              )}
              {ratingError && (
                <div className="tw:mt-1 tw:text-xs tw:text-red-500">
                  {ratingError}
                </div>
              )}
            </div>

            <AppTextarea
              name="comment"
              label="Comment"
              register={register}
              rows={3}
              maxLength={500}
              placeholder="Tell us about your experience with this seller"
            />
          </div>
        </AppModal.Content>

        <AppModal.Footer>
          <div className="tw:flex tw:w-full tw:justify-end tw:gap-2">
            <AppButton
              type="button"
              onClick={close}
              fill="outline"
              color="light"
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              form="rating-review-form"
              isLoading={submitting}
              disabled={submitting}
            >
              Submit Review
            </AppButton>
          </div>
        </AppModal.Footer>
      </form>
    </AppModal>
  );
};

export default RatingModal;
