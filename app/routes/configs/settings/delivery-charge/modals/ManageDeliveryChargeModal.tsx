import { PencilLine, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import AppModal from "~/components/core/modal/AppModal";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";

interface Slab {
  fromKm: number;
  toKm: number;
  charges: number;
}

interface ManageDeliveryChargeModalProps {
  show: boolean;
  onClose?: () => void;
  callback: (a: { action: string; data?: any }) => void;
}

interface FormValues {
  fromOrderValue: string;
  toOrderValue: string;
  freeDelivery: boolean;
  fromKm: string;
  toKm: string;
  charges: string;
}

const getTableHeaders = (t: any) => [
  { label: t("deliveryCharge.fromKm"), key: "fromKm", isCentered: true },
  { label: t("deliveryCharge.toKm"), key: "toKm", isCentered: true },
  { label: t("deliveryCharge.charges"), key: "charges", isCentered: true },
  { label: t("deliveryCharge.actions"), key: "actions", isCentered: true }, // Added actions column
];

export default function ManageDeliveryChargeModal({
  show,
  callback,
  data, // <-- accept data prop
}: ManageDeliveryChargeModalProps & { data?: any }) {
  // extend props
  const { t } = useTranslation(["common"]);
  const [slabs, setSlabs] = useState<Slab[]>([]);
  const { show: showToast } = useAppToast();
  const {
    register,
    formState: { errors },
    reset,
    control,
    getValues,
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      fromOrderValue: "",
      toOrderValue: "",
      freeDelivery: false,
      fromKm: "",
      toKm: "",
      charges: "",
    },
  });

  // useWatch for freeDelivery
  const [freeDelivery] = useWatch({ control, name: ["freeDelivery"] });
  const [slabEditIndex, setSlabEditIndex] = useState<number | null>(null); // For distance slab row
  const [mainEditIndex, setMainEditIndex] = useState<number | null>(null); // For main slab in payload

  // Autofill form when modal opens with data
  useEffect(() => {
    if (show && data) {
      reset({
        fromOrderValue: data.fromOrderValue || "",
        toOrderValue: data.toOrderValue || "",
        freeDelivery: data.freeDelivery ?? false,
        fromKm: "",
        toKm: "",
        charges: "",
      });
      setSlabs(Array.isArray(data.slabs) ? data.slabs : []);
      setSlabEditIndex(null); // Only distance slab edit index is handled locally
      setMainEditIndex(
        typeof data.editIndex === "number" ? data.editIndex : null
      ); // Use editIndex as mainEditIndex
    } else if (show && !data) {
      reset({
        fromOrderValue: "",
        toOrderValue: "",
        freeDelivery: false,
        fromKm: "",
        toKm: "",
        charges: "",
      });
      setSlabs([]);
      setSlabEditIndex(null);
      setMainEditIndex(null);
    }
  }, [show, data, reset]);

  // Function to reset value if negative and show toast
  const handleNegativeInput =
    (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value !== "" && Number(value) < 0) {
        setValue(field, "");
      }
    };

  // Edit handler for distance slab
  const handleEditSlab = (idx: number) => {
    const slab = slabs[idx];
    setValue("fromKm", slab.fromKm.toString());
    setValue("toKm", slab.toKm.toString());
    setValue("charges", slab.charges.toString());
    setSlabEditIndex(idx);
  };

  // Remove handler for distance slab
  const handleRemoveSlab = (idx: number) => {
    setSlabs(slabs.filter((_, i) => i !== idx));
    if (slabEditIndex === idx) {
      setSlabEditIndex(null);
      reset({ fromKm: "", toKm: "", charges: "" });
    }
  };

  // Slab overlap validation function
  function isSlabOverlap(
    slabs: Slab[],
    fromKmNum: number,
    toKmNum: number,
    ignoreIndex: number | null = null
  ) {
    return slabs.some((slab, i) => {
      if (ignoreIndex !== null && ignoreIndex === i) return false;
      return fromKmNum < slab.toKm && toKmNum > slab.fromKm;
    });
  }

  // Main validation function
  function validateDeliveryChargeForm(
    values: FormValues,
    slabs: Slab[]
  ): { msg: string; status: boolean } {
    const fromOrderValueNum = parseFloat(values.fromOrderValue);
    const toOrderValueNum = parseFloat(values.toOrderValue);
    // Convert freeDelivery to boolean for validation
    const isFreeDelivery = String(values.freeDelivery) === "true";

    if (isNaN(fromOrderValueNum) || fromOrderValueNum < 0) {
      return {
        msg: t("deliveryCharge.fromOrderValueRequired"),
        status: false,
      };
    }
    if (isNaN(toOrderValueNum) || toOrderValueNum <= fromOrderValueNum) {
      return {
        msg: t("deliveryCharge.toOrderValueRequired"),
        status: false,
      };
    }
    // Slab is mandatory if no free home delivery
    if (!isFreeDelivery && slabs.length === 0) {
      return {
        msg: t("deliveryCharge.atLeastOneSlabRequired"),
        status: false,
      };
    }
    // Removed slab overlap check from submit validation
    return { msg: "", status: true };
  }

  // Add or update slab
  const addSlab = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const { fromKm, toKm, charges } = getValues();
    const fromKmNum = parseFloat(fromKm);
    const toKmNum = parseFloat(toKm);
    const chargesNum = parseFloat(charges);
    if (isNaN(fromKmNum) || isNaN(toKmNum) || isNaN(chargesNum)) {
      showToast({
        msg: t("deliveryCharge.allSlabFieldsRequired"),
        color: "danger",
      });
      return;
    }
    if (fromKmNum < 0 || toKmNum <= fromKmNum || chargesNum < 0) {
      showToast({
        msg: t("deliveryCharge.invalidSlabValues"),
        color: "danger",
      });
      return;
    }
    if (isSlabOverlap(slabs, fromKmNum, toKmNum, slabEditIndex)) {
      showToast({
        msg: t("deliveryCharge.slabRangeOverlaps"),
        color: "danger",
      });
      return;
    }
    if (slabEditIndex !== null) {
      // Update existing slab
      const updated = slabs.map((slab, i) =>
        i === slabEditIndex
          ? { fromKm: fromKmNum, toKm: toKmNum, charges: chargesNum }
          : slab
      );
      setSlabs(updated);
      setSlabEditIndex(null);
    } else {
      // Add new slab
      setSlabs([
        ...slabs,
        { fromKm: fromKmNum, toKm: toKmNum, charges: chargesNum },
      ]);
    }
    setValue("fromKm", "");
    setValue("toKm", "");
    setValue("charges", "");
  };

  // Cancel edit handler
  const handleCancelEdit = () => {
    setSlabEditIndex(null);
    reset({ fromKm: "", toKm: "", charges: "" });
  };

  const onSubmit = async () => {
    const formData = getValues();
    const validation = validateDeliveryChargeForm(formData, slabs);
    if (!validation.status) {
      showToast({ msg: validation.msg, color: "danger" });
      return;
    }
    try {
      // Fetch existing franchise configs using the same API as payment-config
      const resp = await FranchiseService.getConfigs({});
      const existingConfig = resp?.data?.data?.[0] || null;

      const currentSlabs = existingConfig?.shippingChargesConfig?.slab || [];
      let mainSlabs = [...currentSlabs];

      // Prepare new slab object
      const newSlabObj = {
        fromOrderValue: Number(formData.fromOrderValue),
        toOrderValue: Number(formData.toOrderValue),
        isFree: String(formData.freeDelivery) === "true",
        chargeSlabKiloMeter:
          String(formData.freeDelivery) === "true"
            ? []
            : slabs.map((s) => ({
                from: s.fromKm,
                to: s.toKm,
                charge: s.charges,
              })),
      };

      if (mainEditIndex !== null && mainSlabs[mainEditIndex]) {
        // Edit mode: replace main slab at mainEditIndex
        mainSlabs[mainEditIndex] = newSlabObj;
      } else {
        // Add mode: push new main slab
        mainSlabs.push(newSlabObj);
      }

      const params = {
        shippingChargesConfig: {
          isFree: String(formData.freeDelivery) === "true",
          slab: mainSlabs,
        },
      };

      // Use FranchiseService to create or update config
      let response;
      if (existingConfig && existingConfig._id) {
        response = await FranchiseService.updateConfigs(
          existingConfig._id,
          params
        );
      } else {
        response = await FranchiseService.createConfigs(params);
      }

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        showToast({
          msg: t("deliveryCharge.deliveryChargeSavedSuccessfully"),
          color: "success",
        });
        callback({ action: "save", data: { ...formData, slabs, mainSlabs } });
      } else {
        showToast({
          msg:
            response?.data?.message ||
            t("deliveryCharge.failedToSaveDeliveryCharge"),
          color: "danger",
        });
      }
    } catch (err) {
      showToast({
        msg: t("deliveryCharge.failedToSaveDeliveryCharge"),
        color: "danger",
      });
    }
  };

  const handleFreeDeliveryChange = (value: boolean) => {
    setValue("freeDelivery", value);
  };

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:max-h-[80vh] tw:!max-w-2xl"
    >
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        {t("deliveryCharge.manageDeliveryCharge")}
        <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
          {t("deliveryCharge.defineChargeRuleForOrderValueRange")}
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:space-y-4">
          <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4">
            <div className="tw:grid tw:grid-cols-2 tw:gap-4">
              <AppInput
                name="fromOrderValue"
                label={t("deliveryCharge.fromOrderValue")}
                type="number"
                register={register}
                onChange={handleNegativeInput("fromOrderValue")}
                isRequired
                size="sm"
              />
              <AppInput
                name="toOrderValue"
                label={t("deliveryCharge.toOrderValue")}
                type="number"
                register={register}
                onChange={handleNegativeInput("toOrderValue")}
                isRequired
                size="sm"
              />
            </div>
            <div className="tw:mt-4 tw:flex tw:gap-4 tw:items-center tw:text-sm">
              <label className="tw:block tw:mb-1">
                {t("deliveryCharge.doYouWantToSetFreeHomeDelivery")}
              </label>
              <div className="tw:flex tw:items-center tw:gap-4">
                <label className="tw:flex tw:items-center tw:gap-1">
                  <input
                    type="radio"
                    value="true"
                    {...register("freeDelivery")}
                    checked={String(freeDelivery) === "true"}
                    onChange={handleFreeDeliveryChange.bind(null, true)}
                  />
                  {t("deliveryCharge.yes")}
                </label>
                <label className="tw:flex tw:items-center tw:gap-1">
                  <input
                    type="radio"
                    value="false"
                    {...register("freeDelivery")}
                    checked={String(freeDelivery) === "false"}
                    onChange={handleFreeDeliveryChange.bind(null, false)}
                  />
                  {t("deliveryCharge.no")}
                </label>
              </div>
            </div>
          </div>
          {/* Hide slab block if delivery is free */}
          {!freeDelivery && (
            <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4">
              <div className="tw:text-sm tw:font-medium tw:mb-2">
                {t("deliveryCharge.kilometerWiseChargeConfig")}
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
                {t("deliveryCharge.configureAdditionalChargesBasedOnKilometer")}
              </div>
              <div className="tw:grid tw:grid-cols-4 tw:gap-2">
                <AppInput
                  name="fromKm"
                  label={t("deliveryCharge.fromKm")}
                  type="number"
                  register={register}
                  onChange={handleNegativeInput("fromKm")}
                  size="sm"
                  placeholder="e.g. 0"
                />
                <AppInput
                  name="toKm"
                  label={t("deliveryCharge.toKm")}
                  type="number"
                  register={register}
                  onChange={handleNegativeInput("toKm")}
                  size="sm"
                  placeholder="e.g. 100"
                />
                <AppInput
                  name="charges"
                  label={t("deliveryCharge.charges")}
                  type="number"
                  register={register}
                  onChange={handleNegativeInput("charges")}
                  size="sm"
                  placeholder="e.g. 10"
                />
                <div className="tw:flex tw:gap-2 tw:mt-6">
                  <AppButton
                    type="button"
                    size="small"
                    noShadow={true}
                    onClick={addSlab}
                    color="dark"
                  >
                    {slabEditIndex !== null
                      ? t("deliveryCharge.update")
                      : t("deliveryCharge.add")}
                  </AppButton>
                  {slabEditIndex !== null && (
                    <AppButton
                      type="button"
                      size="small"
                      noShadow={true}
                      onClick={handleCancelEdit}
                    >
                      {t("deliveryCharge.cancel")}
                    </AppButton>
                  )}
                </div>
              </div>
              <div className="tw:mt-4">
                <AppTable size="sm">
                  <AppTable.Header>
                    <TableHeader headers={getTableHeaders(t)} />
                  </AppTable.Header>
                  <AppTable.Body>
                    {slabs.length === 0 ? (
                      <AppTable.Row>
                        <AppTable.Cell colSpan={4} className="tw:text-center">
                          {t("deliveryCharge.noSlabsAdded")}
                        </AppTable.Cell>
                      </AppTable.Row>
                    ) : (
                      slabs.map((slab, idx) => (
                        <AppTable.Row key={idx}>
                          <AppTable.Cell className="tw:text-center">
                            {slab.fromKm}
                          </AppTable.Cell>
                          <AppTable.Cell className="tw:text-center">
                            {slab.toKm}
                          </AppTable.Cell>
                          <AppTable.Cell className="tw:text-center">
                            <Amount
                              value={slab.charges}
                              className="tw:text-center"
                            />
                          </AppTable.Cell>
                          <AppTable.Cell className="tw:text-center">
                            <AppButton
                              type="button"
                              className="tw:text-blue-600 tw:mr-2"
                              onClick={() => handleEditSlab(idx)}
                              fill="outline"
                              size="small"
                            >
                              <PencilLine size={14} />
                            </AppButton>
                            <AppButton
                              type="button"
                              onClick={() => handleRemoveSlab(idx)}
                              fill="outline"
                              color="danger"
                              size="small"
                            >
                              <Trash2 size={14} />
                            </AppButton>
                          </AppTable.Cell>
                        </AppTable.Row>
                      ))
                    )}
                  </AppTable.Body>
                </AppTable>
              </div>
            </div>
          )}
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2 tw:w-full tw:px-4">
          <AppButton
            type="button"
            onClick={() => callback({ action: "close" })}
            fill="outline"
            color="light"
          >
            {t("deliveryCharge.cancel")}
          </AppButton>
          <AppButton type="submit" onClick={onSubmit} color="dark">
            {t("deliveryCharge.save")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
}
