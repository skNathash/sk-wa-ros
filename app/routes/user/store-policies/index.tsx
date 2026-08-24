import { yupResolver } from "@hookform/resolvers/yup";
import { Info, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { redirect } from "react-router";
import * as yup from "yup";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppHeader from "~/components/core/header/AppHeader";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import {
  cleanPolicies,
  EMPTY_POLICY_ROW,
  formatPolicies,
  getPlaceholder,
  MAX_POLICY_KEY_LENGTH,
  MAX_POLICY_VALUE_LENGTH,
  type PolicyFormValues,
} from "./helper";

export const clientLoader = async () => {
  if (!AuthService.getLoggedInUserId()) {
    return redirect("/auth/login");
  }
  return null;
};

export const meta = () => {
  return [{ title: "Store Policies" }];
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "dashboard",
    redirect: { path: "/dashboard" },
    langKey: "dashboard",
  },
  {
    label: "myProfile",
    redirect: { path: "/user/my-profile" },
    langKey: "myProfile",
  },
  {
    label: "storePolicies",
    langKey: "storePolicies",
  },
];

const validationSchema = yup.object({
  ownPolicy: yup.array().of(
    yup.object({
      key: yup
        .string()
        .default("")
        .trim()
        .max(MAX_POLICY_KEY_LENGTH, "Policy title is too long")
        .required("Policy title is required"),
      value: yup
        .string()
        .default("")
        .trim()
        .max(MAX_POLICY_VALUE_LENGTH, "Policy description is too long")
        .required("Policy description is required"),
    }),
  ),
});

const StorePoliciesPage = () => {
  const { t } = useTranslation(["common"]);
  const toast = useAppToast();
  const appNav = useAppNav();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [removeConfirm, setRemoveConfirm] = useState<{
    show: boolean;
    index?: number;
  }>({ show: false });

  const { register, control, handleSubmit, reset, formState } =
    useForm<PolicyFormValues>({
      resolver: yupResolver(validationSchema) as any,
      defaultValues: { ownPolicy: [] },
    });

  const { errors, isDirty } = formState;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ownPolicy",
  });

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const resp = await AuthService.getLoggedInFranchiseDetails();
      const policies = formatPolicies(resp?.data?.data?.ownPolicy);
      reset({ ownPolicy: policies.length ? policies : [] });
    } catch (e) {
      toast.show({ msg: "Failed to fetch store policies", color: "danger" });
      reset({ ownPolicy: [] });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleRemoveConfirm = () => {
    if (removeConfirm.index != null) {
      remove(removeConfirm.index);
    }
    setRemoveConfirm({ show: false });
  };

  const onSubmit = async (values: PolicyFormValues) => {
    setSubmitting(true);
    try {
      const ownPolicy = cleanPolicies(values.ownPolicy || []);
      const resp: any = await FranchiseService.updateFranchise({ ownPolicy });

      if (resp && (resp.statusCode === 200 || resp.statusCode === 201)) {
        toast.show({ msg: "Store policies updated", color: "success" });
        reset({ ownPolicy });
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to update store policies",
          color: "danger",
        });
      }
    } catch (e) {
      toast.show({ msg: "Failed to update store policies", color: "danger" });
    }
    setSubmitting(false);
  };

  return (
    <>
      <AppHeader title={t("storePolicies", "Store Policies")} />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />

          <InfoBlock variant="info" size="sm" bordered className="tw:my-3">
            <div className="tw:flex tw:items-start tw:gap-2">
              <Info className="tw:w-4 tw:h-4 tw:mt-0.5" />
              <div>
                Add your store policies as a title and description. These are
                shown to other retailers on your store&apos;s{" "}
                <span className="tw:font-semibold">More info</span> tab.
              </div>
            </div>
          </InfoBlock>

          {loading ? (
            <div className="tw:flex tw:justify-center tw:py-16">
              <AppSpinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <AppCard
                title="Policies"
                subtitle="Add as many policies as you need"
              >
                {fields.length === 0 ? (
                  <NoData
                    title="No policies added yet"
                    description="Add your first policy to let buyers know how your store works."
                  />
                ) : (
                  <div className="tw:space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="tw:rounded-lg tw:border tw:border-gray-200 tw:p-3"
                      >
                        <div className="tw:flex tw:items-start tw:gap-3">
                          <div className="tw:flex-1 tw:space-y-3">
                            <AppInput
                              name={`ownPolicy.${index}.key`}
                              label="Policy title"
                              isRequired
                              register={register}
                              placeholder={getPlaceholder(index, "key")}
                              maxLength={MAX_POLICY_KEY_LENGTH}
                              error={errors.ownPolicy?.[index]?.key?.message}
                            />
                            <AppTextarea
                              name={`ownPolicy.${index}.value`}
                              label="Policy description"
                              isRequired
                              register={register}
                              rows={3}
                              placeholder={getPlaceholder(index, "value")}
                              maxLength={MAX_POLICY_VALUE_LENGTH}
                              error={errors.ownPolicy?.[index]?.value?.message}
                            />
                          </div>
                          <button
                            type="button"
                            title="Remove policy"
                            className="tw:mt-6 tw:p-2 tw:rounded-md tw:text-red-600 tw:hover:bg-red-50 tw:cursor-pointer"
                            onClick={() =>
                              setRemoveConfirm({ show: true, index })
                            }
                          >
                            <Trash2 className="tw:w-4 tw:h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="tw:mt-4">
                  <AppButton
                    type="button"
                    color="primary"
                    fill="outline"
                    onClick={() => append({ ...EMPTY_POLICY_ROW })}
                  >
                    <Plus className="tw:w-4 tw:h-4 tw:me-1" />
                    Add Policy
                  </AppButton>
                </div>
              </AppCard>

              <div className="tw:flex tw:justify-end tw:gap-2">
                <AppButton
                  type="button"
                  color="light"
                  fill="outline"
                  disabled={submitting}
                  onClick={() => appNav.to("/user/my-profile")}
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="submit"
                  color="primary"
                  isLoading={submitting}
                  disabled={submitting || !isDirty}
                >
                  Save Policies
                </AppButton>
              </div>
            </form>
          )}
        </div>
      </div>

      <AppAlertDialog
        show={removeConfirm.show}
        title="Remove this policy?"
        description="This policy will be removed from the list. You still need to save for the change to take effect."
        okText="Remove"
        cancelText="Keep"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemoveConfirm({ show: false })}
      />
    </>
  );
};

export default StorePoliciesPage;
