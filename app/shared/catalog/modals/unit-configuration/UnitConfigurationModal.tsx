import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppCheckbox, AppInput, AppSelect } from "~/components/core/form";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { SellerDeal } from "~/types/CommonTypes";
import CaseOverrideNote from "../../components/case-override-note/CaseOverrideNote";

type UomOption = { label: string; value: string };

type Props = {
  show: boolean;
  dealId: string;
  callback: (a: { action: string; data?: any }) => void;
};

type FormData = {
  quantity: number | null;
  sellingType: string;
  // selectedStockUom: string;
  remarks: string;
  allowQtyOverride: boolean;
};

const UnitConfigurationModal = ({ show, dealId, callback }: Props) => {
  const { control, register, setValue, getValues } = useForm<FormData>({
    defaultValues: {
      quantity: null,
      sellingType: "Unit",
      // selectedStockUom: "",
      remarks: "",
      allowQtyOverride: false,
    },
  });
  const sellingType = useWatch({ control, name: "sellingType" });
  const appToast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [deal, setDeal] = useState<SellerDeal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [packageTypeOptions, setPackageTypeOptions] = useState<UomOption[]>([]);
  // const [stockUomOptions, setStockUomOptions] = useState<UomOption[]>([]);

  const handleClose = () => callback({ action: "close" });

  useEffect(() => {
    if (show) {
      const fetchDeal = async () => {
        try {
          setLoading(true);
          const resp = await SellerCatalogService.getProducts({
            filter: {
              dealId: dealId,
            },
          });
          const dealList = SellerCatalogService.formatProductResponse(
            resp?.data?.data || [],
          );
          setDeal(dealList?.[0] || null);
        } catch (error) {
          console.error("Error fetching deal details:", error);
          setDeal(null);
        } finally {
          setLoading(false);
        }
      };
      fetchDeal();

      const fetchUomOptions = async () => {
        try {
          const [pkgResp /*, stockResp */] = await Promise.all([
            CommonService.getUomMasters({ filter: { isPackType: true } }),
            // CommonService.getUomMasters({ filter: { isPackType: false } }),
          ]);
          const pkgList = pkgResp?.data?.data || [];
          // const stockList = stockResp?.data?.data || [];
          setPackageTypeOptions(
            pkgList.map((item: any) => ({
              label: item.name,
              value: item.name,
            })),
          );
          // setStockUomOptions(
          //   stockList.map((item: any) => ({
          //     label: item.name,
          //     value: item.name,
          //   })),
          // );
        } catch (e) {
          console.error("Error fetching uom masters:", e);
        }
      };
      fetchUomOptions();
    }
  }, [show, dealId]);

  useEffect(() => {
    if (deal) {
      const sellingTypeMap = SellerCatalogService.getSellingTypes();
      const matched = sellingTypeMap.find(
        (s) => s.value === deal.sellingType,
      );
      const sType = matched?.apiValue || "Unit";

      setValue("sellingType", sType);
      setValue("remarks", "");

      setValue("quantity", deal.packageQty || null);
      setValue("allowQtyOverride", deal.overridePackQtyOnLowStock || false);
      // setValue("selectedStockUom", deal.selectedStockUom || "");
    }
  }, [deal, setValue]);

  const handleSubmit = async () => {
    const formData = getValues();

    if (formData.sellingType !== "Unit" && !formData.quantity) {
      appToast.show({
        msg: `Please enter package quantity for ${formData.sellingType}`,
        color: "error",
      });
      return;
    }

    if (!formData.sellingType) {
      appToast.show({
        msg: "Please select a sell in configuration",
        color: "error",
      });
      return;
    }

    // if (formData.sellingType === "Unit" && !formData.selectedStockUom) {
    //   appToast.show({
    //     msg: "Please select a stock UOM",
    //     color: "error",
    //   });
    //   return;
    // }

    try {
      setSubmitting(true);
      const packConfig: any[] = [
        {
          packType: formData.sellingType,
          quantity: formData.quantity || 1,
          isDefault: true,
          allowCaseQtyOverride: formData.allowQtyOverride,
        },
      ];

      const payload = {
        sellerId: AuthService.getLoggedInUserId(),
        dealId: dealId,
        packConfig,
        // ...(formData.selectedStockUom && {
        //   selectedStockUom: formData.selectedStockUom,
        // }),
        remarks: formData.remarks || `Updated to ${formData.sellingType} type`,
      };

      const resp = await SellerCatalogService.packConfig(payload);
      if (resp.statusCode === 200) {
        appToast.show({
          msg: "Configuration updated successfully",
          color: "success",
        });
        callback({ action: "submit", data: payload });
      } else {
        appToast.show({
          msg: resp.data?.message || "Failed to update configuration",
          color: "error",
        });
      }
    } catch (error) {
      console.error("Error updating pack config:", error);
      appToast.show({ msg: "An error occurred", color: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const packageTypes = packageTypeOptions;

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <span className="tw:font-semibold tw:text-base tw:tracking-tight">
          Sell In Configuration
        </span>
      </AppModal.Title>
      <AppModal.Content>
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
            <AppSpinner />
          </div>
        ) : (
          <div className="tw:space-y-4">
            <AppCard className="!tw:p-3" bodyClassName="!tw:p-0">
              <div className="tw:flex tw:gap-3 tw:items-start">
                <div className="tw:border tw:border-gray-100 tw:bg-gray-50 tw:rounded-md tw:p-1 tw:shrink-0">
                  <ImgRender
                    assetId={deal?.images?.[0]}
                    className="tw:w-12 tw:h-12 tw:object-contain"
                    size="200"
                  />
                </div>
                <div className="tw:flex-1 tw:min-w-0">
                  <p className="tw:text-sm tw:font-medium tw:text-gray-900 tw:line-clamp-2 tw:leading-snug tw:mb-1.5">
                    {deal?.name}
                  </p>

                  <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-1">
                    <span className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center">
                      <span className="tw:font-medium tw:mr-1">ID:</span>{" "}
                      {deal?.id}
                    </span>
                    <span className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center">
                      <span className="tw:font-medium tw:mr-1">Stock:</span>
                      <span className="tw:font-semibold tw:text-green-600">
                        {deal?.actualMaxQty} units
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </AppCard>

            <AppCard
              title={
                <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                  Sell In Configuration
                </span>
              }
              icon={<ShoppingCart className="tw:text-gray-500 tw:w-4 tw:h-4" />}
              subtitle={
                <span className="tw:text-xs tw:text-gray-500">
                  Choose how you sell this product
                </span>
              }
              className="!tw:p-3"
              headerClassName="!tw:p-0 !tw:mb-3"
              bodyClassName="!tw:p-0"
            >
              <div className="tw:flex tw:flex-col tw:gap-3">
                <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                  <div>
                    <Controller
                      name="sellingType"
                      control={control}
                      render={({ field }) => (
                        <AppSelect
                          options={packageTypes}
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val);
                            if (val === "Unit") {
                              setValue("quantity", 1);
                              setValue("allowQtyOverride", false);
                            }
                          }}
                          size="sm"
                          placeholder="Select Sell As"
                          label="Sell As"
                          isRequired
                          inputClassName="tw:w-full"
                        />
                      )}
                    />
                  </div>
                  {sellingType === "Unit" ? null : (
                    // <Controller
                    //   name="selectedStockUom"
                    //   control={control}
                    //   render={({ field }) => (
                    //     <AppSelect
                    //       options={stockUomOptions}
                    //       value={field.value}
                    //       onChange={(val) => field.onChange(val)}
                    //       size="sm"
                    //       placeholder="Select Stock UOM"
                    //       label="Stock UOM"
                    //       inputClassName="tw:w-full"
                    //     />
                    //   )}
                    // />
                    <div className="tw:space-y-2">
                      <AppInput
                        name="quantity"
                        label="Package Quantity"
                        type="number"
                        register={register}
                        isRequired
                        size="sm"
                        placeholder="0"
                        onChange={(e) => {
                          const val = e.target.value;
                          const sanitized = val.replace(/[^0-9]/g, "");
                          if (val !== sanitized) {
                            setValue(
                              "quantity",
                              sanitized ? parseInt(sanitized, 10) : null,
                            );
                          }
                        }}
                      />
                      <Controller
                        name="allowQtyOverride"
                        control={control}
                        render={({ field }) => (
                          <AppCheckbox
                            label={
                              <span className="tw:text-xs tw:text-gray-600 tw:flex tw:items-center tw:gap-1">
                                Override to units
                                <CaseOverrideNote />
                              </span>
                            }
                            value={field.value}
                            onChange={(e) => setValue("allowQtyOverride", e)}
                            size="sm"
                          />
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </AppCard>
          </div>
        )}
      </AppModal.Content>
      {deal && !loading && (
        <AppModal.Footer>
          <div className="tw:flex tw:justify-end tw:gap-2">
            <AppButton fill="outline" onClick={handleClose} color="dark">
              Cancel
            </AppButton>
            <AppButton
              color="success"
              onClick={handleSubmit}
              isLoading={submitting}
            >
              Save
            </AppButton>
          </div>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default UnitConfigurationModal;
