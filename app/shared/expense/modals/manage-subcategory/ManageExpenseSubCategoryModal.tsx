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
import AppSpinner from "~/components/core/Spinner/AppSpinner";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  mode: "add" | "edit";
  parentCategoryId?: string;
  editId?: string;
};

const ManageExpenseSubCategoryModal = ({
  show,
  callback,
  mode,
  parentCategoryId,
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

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentName, setParentName] = useState<string | null>(null);

  const handleClose = () => {
    callback({ action: "close" });
  };

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
        response = await ExpenseService.createSubCategory({
          name,
          description,
          categoryId: parentCategoryId,
        });
      } else {
        response = await ExpenseService.updateSubCategory(editId || "", {
          name,
          description,
        });
      }

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        toast.show({
          msg: t("manageSubCategory.subCategoryCreatedSuccessfully"),
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
            t("manageSubCategory.subCategoryCreationFailed"),
          color: "error",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchParent = async () => {
      if (!show || !parentCategoryId) {
        setParentName(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // fetch categories filtered by id to get the parent category details
        const response = await ExpenseService.getCategories({
          filter: { _id: parentCategoryId },
        });
        const data = response?.data?.data?.data || [];
        if (data.length > 0) {
          setParentName(data[0].name || null);
        }
      } catch (err) {
        console.error("Failed to fetch parent category", err);
      } finally {
        setLoading(false);
      }
    };

    fetchParent();
  }, [show, parentCategoryId]);

  useEffect(() => {
    if (show && mode === "edit" && editId) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const response = await ExpenseService.getSubCategories({
            filter: { _id: editId },
          });
          const data = response?.data?.data?.data || [];
          if (data.length > 0) {
            setValue("name", data[0].name || "");
            setValue("description", data[0].description || "");
          }
        } catch (err) {
          console.error("Failed to fetch sub category", err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [show, mode, editId, setValue]);

  // Reset form when modal is opened for add mode to avoid showing stale values
  useEffect(() => {
    if (show && mode === "add") {
      reset({ name: "", description: "" });
    }
  }, [show, mode, reset]);

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">
          {mode === "add"
            ? t("manageSubCategory.addSubCategory")
            : t("manageSubCategory.editSubCategory")}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
            <AppSpinner />
          </div>
        ) : (
          <>
            {parentName && (
              <div className="tw:bg-muted tw:p-3 tw:rounded-lg tw:mb-4">
                <p className="tw:text-xs tw:text-muted-foreground">
                  {t("manageSubCategory.parentCategory")}
                </p>
                <h3 className="tw:text-sm tw:font-medium tw:text-foreground">
                  {parentName}
                </h3>
              </div>
            )}

            <AppInput
              name="name"
              label={t("manageSubCategory.labelName")}
              register={register}
              isRequired={true}
              placeholder={t("manageSubCategory.enterSubCategoryName")}
              className="tw:mb-4"
              maxLength={100}
            />

            <AppTextarea
              name="description"
              label={t("manageSubCategory.labelDescription")}
              register={register}
              placeholder={t("manageSubCategory.enterDescription")}
              maxLength={200}
            />
            <div className="tw:text-xs tw:text-muted-foreground">
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

export default ManageExpenseSubCategoryModal;
