import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import ExpenseService from "~/services/ExpenseService";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  mode: "add" | "edit";
  editId?: string | null;
};

const ManageExpenseCategoryModal = ({
  show,
  callback,
  mode,
  editId,
}: Props) => {
  const { register, handleSubmit, setValue, reset } = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });
  const { t } = useTranslation(["expense"]);
  const toast = useAppToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    callback({ action: "close" });
  };

  useEffect(() => {
    if (show && mode === "add") {
      reset({ name: "", description: "" });
      return;
    }

    const fetchDetails = async (id: string) => {
      setIsLoading(true);
      try {
        const params: Record<string, any> = {
          page: 1,
          limit: 1,
          filter: { _id: id },
        };
        const resp = await ExpenseService.getCategories(params);
        const item = resp?.data?.data?.data?.[0];
        if (item) {
          setValue("name", item.name || "");
          setValue("description", item.description || "");
        }
      } catch (err) {
        console.error("Error fetching category details", err);
        toast.show({ msg: t("somethingWentWrong"), color: "error" });
      } finally {
        setIsLoading(false);
      }
    };

    if (show && mode === "edit" && editId) {
      fetchDetails(editId);
    }
  }, [show, mode, editId]);

  const onSubmit = async (data: any) => {
    const name = data.name?.trim();
    const description = data.description?.trim();

    if (!name) {
      toast.show({
        msg: t("manageCategory.nameRequired"),
        color: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let response: any;
      if (mode === "add") {
        response = await ExpenseService.createCategory({ name, description });
      } else {
        if (!editId) {
          toast.show({ msg: t("somethingWentWrong"), color: "error" });
          setIsSubmitting(false);
          return;
        }
        response = await ExpenseService.updateCategory(editId, {
          name,
          description,
        });
      }

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        toast.show({
          msg: t("manageCategory.categoryCreatedSuccessfully"),
          color: "success",
        });
        callback({
          action: "success",
          data: {
            name: name,
            value: response.data.data,
          },
        });
      } else {
        toast.show({
          msg:
            response?.data?.message ||
            t("manageCategory.categoryCreationFailed"),
          color: "error",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">
          {mode === "add"
            ? t("manageCategory.addCategory")
            : t("manageCategory.editCategory")}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        {isLoading ? (
          <div className="tw-py-4">Loading...</div>
        ) : (
          <>
            <AppInput
              name="name"
              label={t("manageCategory.labelName")}
              register={register}
              isRequired={true}
              placeholder={t("manageCategory.enterCategoryName")}
              className="tw:mb-4"
              maxLength={100}
            />

            <AppTextarea
              name="description"
              label={t("manageCategory.labelDescription")}
              register={register}
              placeholder={t("manageCategory.enterDescription")}
              maxLength={200}
            />
            <div className="tw:text-xs tw:text-gray-500">
              Max 200 characters
            </div>
          </>
        )}
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:text-end">
          <AppButton
            color="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            <Save /> {isSubmitting ? t("saving") : t("save")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ManageExpenseCategoryModal;
