import React from "react";
import { useForm } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppButton from "~/components/core/button/AppButton";

interface ReplyFormValues {
  message: string;
}

const Reply: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ReplyFormValues>();

  const onSubmit = async (data: ReplyFormValues) => {
    // TODO: handle reply submission (API call or state update)
    // For now, just reset the form
    reset();
  };

  return (
    <AppCard title="Reply to Ticket">
      <form onSubmit={handleSubmit(onSubmit)}>
        <AppTextarea
          label="Your Reply"
          name="message"
          register={register}
          rules={{ required: "Reply is required" }}
          error={errors.message?.message}
          rows={4}
          isRequired
          placeholder="Type your reply here..."
        />
        <div className="tw:mt-4 tw:flex tw:justify-end">
          <AppButton type="submit" isLoading={isSubmitting} color="primary">
            Send Reply
          </AppButton>
        </div>
      </form>
    </AppCard>
  );
};

export default Reply;
