import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import AppModal from "~/components/core/modal/AppModal";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import PosService from "~/services/PosService";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";

interface RspManagementModalProps {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  dealId: string;
  configType: "Customer" | "Network";
}

interface FormData {
  mrp: number;
  rsp: number;
  networkPrice: number;
  sellForFree: boolean;
  networkConfig: {
    by: "Overall" | "Franchise";
    fId?: string;
  };
}

const validationSchema = yup.object().shape({
  mrp: yup
    .number()
    .required("MRP is required")
    .min(0.01, "MRP must be greater than 0")
    .typeError("MRP must be a valid number"),
  rsp: yup
    .number()
    .required("RSP is required")
    .min(0, "RSP cannot be negative")
    .typeError("RSP must be a valid number")
    .test("rsp-validation", "RSP cannot be greater than MRP", function (value) {
      const { mrp } = this.parent;
      if (value && mrp && value > mrp) {
        return false;
      }
      return true;
    }),
  networkPrice: yup
    .number()
    .required("Network Price is required")
    .min(0, "Network Price cannot be negative")
    .typeError("Network Price must be a valid number")
    .test(
      "network-price-validation",
      "Network Price cannot be greater than MRP",
      function (value) {
        const { mrp } = this.parent;
        if (value && mrp && value > mrp) {
          return false;
        }
        return true;
      }
    ),
  sellForFree: yup.boolean().default(false),
  networkConfig: yup.object().shape({
    by: yup.string().oneOf(["Overall", "Franchise"]).required(),
    fId: yup.string().when("by", {
      is: "Franchise",
      then: yup
        .string()
        .required(
          "Franchise ID is required when applying to specific franchise"
        ),
      otherwise: yup.string().optional(),
    }),
  }),
});

const RspManagementModal: React.FC<RspManagementModalProps> = ({
  show,
  callback,
  dealId,
  configType,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [existingConfig, setExistingConfig] = useState<any>(null);
  const [dealData, setDealData] = useState<any>(null);

  const appToast = useAppToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      mrp: 0,
      rsp: 0,
      networkPrice: 0,
      sellForFree: false,
      networkConfig: {
        by: "Overall",
        fId: "",
      },
    },
    resolver: yupResolver(validationSchema),
  });

  const sellForFree = watch("sellForFree");
  const networkConfigBy = watch("networkConfig.by");

  useEffect(() => {
    if (show && dealId) {
      loadExistingConfig();
      loadDealData();
    }
  }, [show, dealId]);

  useEffect(() => {
    if (sellForFree) {
      setValue("rsp", 0.1);
    }
  }, [sellForFree, setValue]);

  const loadDealData = async () => {
    try {
      const response = await PosService.getDealInventory({
        filter: {
          _id: AuthService.getLoggedInUserId(),
        },
        dealFilter: {
          _id: dealId,
        },
      });

      if (response.statusCode === 200 && response.data?.length > 0) {
        setDealData(response.data[0]);
      }
    } catch (error) {
      console.error("Error loading deal data:", error);
    }
  };

  const loadExistingConfig = async () => {
    setIsLoading(true);
    try {
      const response = await PosService.getRspConfigList({
        filter: {
          "deal.id": dealId,
        },
      });

      if (response.statusCode === 200 && response.data?.length > 0) {
        const config = response.data[0];
        setExistingConfig(config);

        // Set form values from existing config
        setValue("mrp", config.mrp || 0);
        setValue("rsp", config.sellingPrice || 0);
        setValue("networkPrice", config.networkPrice || 0);
        setValue("sellForFree", config.sellingPrice === 0.1);
        setValue("networkConfig.by", config.networkConfig?.by || "Overall");
        setValue("networkConfig.fId", config.networkConfig?.fId || "");
      } else {
        setExistingConfig(null);
        reset();
      }
    } catch (error) {
      console.error("Error loading RSP config:", error);
      appToast.show({
        msg: "Failed to load existing RSP configuration",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const finalRsp = formData.sellForFree ? 0.1 : formData.rsp;
      const finalNetworkPrice = formData.networkPrice;

      const discount = CommonService.roundedByDecimalPlace(
        Number(100 - (finalRsp / formData.mrp) * 100),
        4
      );

      const networkDiscount = CommonService.roundedByDecimalPlace(
        Number(100 - (finalNetworkPrice / formData.mrp) * 100),
        4
      );

      const payload = {
        discount: discount,
        networkDiscount: networkDiscount,
        id: dealId,
        configOnType: "Deal",
        status: "Active",
        mrp: formData.mrp,
        price: finalRsp,
        networkPrice: finalNetworkPrice,
        isFixedPrice: false,
        applicableFor: configType,
        networkConfig: formData.networkConfig,
      };

      let response;
      if (existingConfig) {
        // Update existing config
        response = await PosService.updateRspConfig({
          ...payload,
          _id: existingConfig._id,
        });
      } else {
        // Create new config
        response = await PosService.createRspConfig(payload);
      }

      if (response.statusCode === 200) {
        appToast.show({
          msg: `RSP configuration ${
            existingConfig ? "updated" : "created"
          } successfully`,
          color: "success",
        });

        // Calculate updated pricing data for the deal
        const updatedPricingData = {
          dealId: dealId,
          retailerSellingPrice: finalRsp,
          networkPrice: finalNetworkPrice,
          _finalSellingPrice: CommonService.roundedByDecimalPlace(finalRsp, 2),
          mrp: formData.mrp,
          _pnl: PosService.calculatePnL(finalRsp, dealData?.pp || 0),
        };

        callback({
          action: "success",
          data: {
            ...response.data,
            updatedPricing: updatedPricingData,
          },
        });
      } else {
        throw new Error(
          response.data?.message || "Failed to save RSP configuration"
        );
      }
    } catch (error: any) {
      console.error("Error saving RSP config:", error);
      appToast.show({
        msg: error.message || "Failed to save RSP configuration",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={callback} isAutoHeight>
      <AppModal.Title onClose={handleClose} noShadow={true}>
        {existingConfig ? "Update" : "Create"} {configType} Price Configuration
      </AppModal.Title>

      <div className="ion-padding modal-bg">
        {isLoading ? (
          <div className="tw:text-center tw:py-8">
            <div className="tw:animate-spin tw:rounded-full tw:h-8 tw:w-8 tw:border-b-2 tw:border-primary tw:mx-auto"></div>
            <div className="tw:mt-2 tw:text-sm tw:text-gray-600">
              Loading configuration...
            </div>
          </div>
        ) : (
          <>
            {/* Deal Information */}
            <AppCard className="shadow-sm border-0 mb-3">
              <div className="tw:text-sm tw:text-gray-500 tw:mb-1">
                Product Name
              </div>
              <div>
                <span className="tw:font-semibold tw:mb-1 tw:text-base">
                  {dealData?.name}
                </span>
                <div className="tw:mt-1 tw:text-sm tw:text-gray-500">
                  <span className="text-muted">ID: </span>
                  <span className="font-weight-500">{dealData?._id}</span>
                </div>
              </div>
            </AppCard>

            <AppCard className="tw:mb-4">
              <div className="tw:space-y-4">
                <div className="tw:grid tw:grid-cols-1 md:tw:grid-cols-2 tw:gap-4">
                  <AppInput
                    name="mrp"
                    label="MRP"
                    type="number"
                    placeholder="Enter MRP"
                    register={register}
                    error={errors.mrp?.message}
                    isRequired
                    size="sm"
                  />

                  {configType === "Customer" && (
                    <AppInput
                      name="rsp"
                      label="RSP (Retail Selling Price)"
                      type="number"
                      placeholder="Enter RSP"
                      register={register}
                      error={errors.rsp?.message}
                      isRequired
                      size="sm"
                      disabled={sellForFree}
                    />
                  )}
                </div>

                {configType === "Network" && (
                  <div className="tw:grid tw:grid-cols-1 md:tw:grid-cols-2 tw:gap-4">
                    <AppInput
                      name="networkPrice"
                      label="Network Price"
                      type="number"
                      placeholder="Enter Network Price"
                      register={register}
                      error={errors.networkPrice?.message}
                      isRequired
                      size="sm"
                    />
                  </div>
                )}

                <div className="tw:flex tw:items-center tw:space-x-2">
                  <input
                    type="checkbox"
                    id="sellForFree"
                    {...register("sellForFree")}
                    className="tw:rounded tw:border-gray-300 tw:text-primary focus:tw:ring-primary"
                  />
                  <label
                    htmlFor="sellForFree"
                    className="tw:text-sm tw:font-medium tw:text-gray-700"
                  >
                    Sell for Free (RSP = ₹0.1)
                  </label>
                </div>

                {sellForFree && (
                  <div className="tw:text-xs tw:text-gray-500 tw:bg-gray-50 tw:p-2 tw:rounded">
                    When "Sell for Free" is enabled, RSP will be automatically
                    set to ₹0.1
                  </div>
                )}
              </div>
            </AppCard>

            <div className="tw:flex tw:justify-end tw:space-x-2">
              <AppButton
                fill="outline"
                color="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </AppButton>
              <AppButton
                color="primary"
                onClick={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                disabled={isLoading}
              >
                {existingConfig ? "Update" : "Create"} {configType} Price
              </AppButton>
            </div>
          </>
        )}
      </div>
    </AppModal>
  );
};

export default RspManagementModal;
