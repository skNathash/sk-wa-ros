import { useForm, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppSelect from "~/components/core/form/AppSelect";
import FileUpload from "~/components/core/file-upload/FileUpload";

import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

import TicketService from "~/services/TicketService";
import useAppToast from "~/hooks/useAppToast";

const breadcrumbs = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  { label: "Ticket Management", redirect: { path: "/ticket/list" } },
  { label: "Create Ticket" },
];

const priorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" },
];

const assignToOptions = [
  { value: "1", label: "John Doe" },
  { value: "2", label: "Jane Smith" },
  { value: "3", label: "Support Team" },
];

const TicketManage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm();

  const [attachments, setAttachments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { show: showToast } = useAppToast();

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const res = await TicketService.getTicketCategoryList({});
        // Response is { data: { data: [{ _id, name }, ...] } }
        if (res?.data?.data) {
          setCategories(
            res.data.data.map((cat: any) => ({
              value: cat._id,
              label: cat.name,
            }))
          );
        }
      } catch (e) {
        // handle error (optional)
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const onFileUpload = (file: any) => {
    setAttachments((prev) => [...prev, file]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const assignToObj = assignToOptions.find(
        (a) => a.value === data.assignTo
      );
      const payload = {
        title: data.title,
        description: data.description,
        attachment: attachments,
        categoryId: data.category,
        priority: data.priority,
        // assignedTo: assignToObj
        //   ? { id: assignToObj.value, name: assignToObj.label }
        //   : undefined,
      };
      const res = await TicketService.createTicket(payload);
      if (
        res?.statusCode &&
        (res.statusCode == 200 || res?.statusCode === 201)
      ) {
        showToast({ msg: "Ticket created successfully!", color: "success" });
      } else {
        const msg = res.data?.message || "Failed to create ticket";
        showToast({ msg: String(msg), color: "error" });
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to create ticket";
      showToast({ msg, color: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AppHeader title="Create Ticket" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {isLoading ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:min-h-[200px]">
              <AppSpinner />
            </div>
          ) : (
            <>
              <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:gap-4 tw:mb-4">
                <div>
                  <AppBreadcrumbs data={breadcrumbs} />
                  <div className="tw:text-sm tw:text-gray-500 tw:mt-2">
                    Create a new support or operational ticket.
                  </div>
                </div>
              </div>
              <AppCard>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="tw:space-y-6"
                >
                  <AppInput
                    name="title"
                    label="Title"
                    register={register}
                    rules={{ required: "Title is required" }}
                    error={errors.title?.message as string}
                    isRequired
                  />
                  <AppTextarea
                    name="description"
                    label="Description"
                    register={register}
                    rules={{ required: "Description is required" }}
                    error={errors.description?.message as string}
                    isRequired
                    rows={4}
                  />
                  <div>
                    <div className="tw:mb-2 tw:font-medium">Attachment</div>
                    <FileUpload
                      onFileUpload={onFileUpload}
                      label="Upload File"
                    />
                    {attachments.length > 0 && (
                      <div className="tw:mt-3">
                        <FileUploadedSlide
                          images={attachments}
                          onRemove={handleRemoveAttachment}
                        />
                      </div>
                    )}
                  </div>
                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
                    <Controller
                      name="category"
                      control={control}
                      rules={{ required: "Category is required" }}
                      render={({ field }) => (
                        <AppSelect
                          label="Category"
                          options={categories}
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.category?.message as string}
                          isRequired
                          inputClassName="tw:w-full"
                        />
                      )}
                    />
                    <Controller
                      name="priority"
                      control={control}
                      rules={{ required: "Priority is required" }}
                      render={({ field }) => (
                        <AppSelect
                          label="Priority"
                          options={priorityOptions}
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.priority?.message as string}
                          isRequired
                          inputClassName="tw:w-full"
                        />
                      )}
                    />
                    <Controller
                      name="assignTo"
                      control={control}
                      rules={{ required: "Assign To is required" }}
                      render={({ field }) => (
                        <AppSelect
                          label="Assign To"
                          options={assignToOptions}
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.assignTo?.message as string}
                          isRequired
                          inputClassName="tw:w-full"
                        />
                      )}
                    />
                  </div>
                  <div className="tw:mt-4 tw:text-right">
                    <AppButton
                      type="submit"
                      isLoading={isSubmitting}
                      color="dark"
                    >
                      Create Ticket
                    </AppButton>
                  </div>
                </form>
              </AppCard>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TicketManage;
