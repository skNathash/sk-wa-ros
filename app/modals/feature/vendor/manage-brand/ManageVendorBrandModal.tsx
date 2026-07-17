import { Check, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import VendorService from "~/services/VendorService";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";

interface ManageVendorBrandModalProps {
  vendorId: string;
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
}

interface VendorData {
  _id: string;
  vendorId?: string;
  name: string;
  address?: {
    town?: string;
    district?: string;
    state?: string;
    postcode?: string;
  };
  pincode?: string;
  sourceableBrands?: Array<{
    _id: string;
    name: string;
    brandId: string;
  }>;
  sourceAllBrands?: boolean;
}

interface FormData {
  sourceAllBrands: boolean;
}

const ManageVendorBrandModal = ({
  vendorId,
  show,
  callback,
}: ManageVendorBrandModalProps) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [showConfirmSourceAll, setShowConfirmSourceAll] = useState(false);

  const { control, handleSubmit, setValue, reset } = useForm<FormData>({
    defaultValues: {
      sourceAllBrands: false,
    },
  });

  const sourceAllBrands = useWatch({
    control,
    name: "sourceAllBrands",
  });

  // Fetch vendor details when modal opens
  useEffect(() => {
    if (show && vendorId) {
      fetchVendorDetails();
    }
  }, [show, vendorId]);

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      const response = await VendorService.getDetail(vendorId);

      if (response.statusCode === 200 && response.data?.data) {
        const vendor = response.data.data;
        setVendorData(vendor);

        // Prepare selectedBrands from sourceableBrands (API response)
        let selectedBrandsArr: any[] = [];

        if (
          vendor.sourceableBrands &&
          Array.isArray(vendor.sourceableBrands) &&
          vendor.sourceableBrands.length > 0
        ) {
          // Sort sourceableBrands alphabetically by name
          const sortedBrands = [...vendor.sourceableBrands].sort((a, b) =>
            (a.name || "").localeCompare(b.name || ""),
          );

          selectedBrandsArr = sortedBrands.map((b: any) => ({
            label: b.brandName || "",
            value: {
              id: b.brandId || "",
              name: b.brandName || "",
            },
          }));
        }

        setSelectedBrands(selectedBrandsArr);
        setSelectedBrand(null); // Reset selected brand
        reset({
          sourceAllBrands: vendor.sourceAllBrands || false,
        });
      }
    } catch (error: any) {
      console.error("Error fetching vendor details:", error);
      appToast.show({
        msg: error?.message || "Failed to fetch vendor details",
        color: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBrandSelect = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setSelectedBrand(item);
    } else if (action === "remove") {
      setSelectedBrand(null);
    }
  };

  const handleRemoveBrand = async (brandId: string) => {
    try {
      setSubmitting(true);

      // Find the brand to remove
      const brandToRemove = selectedBrands.find(
        (brand) => brand.value.id === brandId,
      );
      if (!brandToRemove) return;

      const brands = [
        {
          name: brandToRemove.value.name,
          brandId: brandToRemove.value.id,
          action: false,
        },
      ];

      const response = await VendorService.updateVendorBrands(vendorId, brands);

      if (response.statusCode === 200 || response.statusCode === 201) {
        // Remove from local state
        setSelectedBrands((prev) =>
          prev.filter((brand) => brand.value.id !== brandId),
        );
        appToast.show({
          msg: "Brand " + brandToRemove.value.name + " removed successfully",
          color: "success",
        });
      } else {
        throw new Error(response.data?.message || "Failed to remove brand");
      }
    } catch (error: any) {
      console.error("Error removing brand:", error);
      appToast.show({
        msg: error?.message || "Failed to remove brand",
        color: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBrand = async () => {
    if (!selectedBrand) {
      appToast.show({
        msg: "Please select a brand to add",
        color: "error",
      });
      return;
    }

    // Check if brand is already selected
    const isAlreadySelected = selectedBrands.some(
      (brand) => brand.value.id === selectedBrand.value.id,
    );

    if (isAlreadySelected) {
      appToast.show({
        msg: "Brand is already selected",
        color: "error",
      });
      return;
    }

    try {
      setSubmitting(true);

      const brands = [
        {
          name: selectedBrand.value.name,
          brandId: selectedBrand.value.id,
          action: true,
        },
      ];

      // If source all brands is enabled, send false to disable it when adding a brand
      const response = await VendorService.updateVendorBrands(
        vendorId,
        brands,
        sourceAllBrands ? false : undefined,
      );

      if (response.statusCode === 200 || response.statusCode === 201) {
        // Add to local state
        setSelectedBrands((prev) => [...prev, selectedBrand]);
        setSelectedBrand(null); // Reset selection

        // If source all brands was enabled, disable it in the form
        if (sourceAllBrands) {
          setValue("sourceAllBrands", false);
        }

        appToast.show({
          msg: "Brand added successfully",
          color: "success",
        });
      } else {
        throw new Error(response.data?.message || "Failed to add brand");
      }
    } catch (error: any) {
      console.error("Error adding brand:", error);
      appToast.show({
        msg: error?.message || "Failed to add brand",
        color: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onSourceAllBrandsChange = (onChange: (value: boolean) => void) => {
    return (checked: boolean) => {
      onChange(checked);
      if (checked) {
        setSelectedBrands([]);
      }
    };
  };

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);

      // For source all brands, send empty brands array with sourceAllBrands: true
      if (data.sourceAllBrands) {
        const response = await VendorService.updateVendorBrands(
          vendorId,
          [],
          true,
        );

        if (response.statusCode === 200 || response.statusCode === 201) {
          appToast.show({
            msg: "Source all brands setting updated successfully",
            color: "success",
          });
          callback({
            action: "success",
            data: {
              sourceAllBrands: data.sourceAllBrands,
            },
          });
        } else {
          throw new Error(
            response.data?.message ||
              "Failed to update source all brands setting",
          );
        }
        return;
      }

      // If no brands selected and not source all brands
      if (selectedBrands.length === 0) {
        appToast.show({
          msg: "Please select at least one brand or enable source all brands",
          color: "error",
        });
        return;
      }

      // The brands are already managed individually through add/remove operations
      // So we just need to close the modal
      callback({
        action: "success",
        data: {
          sourceAllBrands: data.sourceAllBrands,
        },
      });
    } catch (error: any) {
      console.error("Error updating vendor brands:", error);
      appToast.show({
        msg: error?.message || "Failed to update vendor brands",
        color: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedBrand(null); // Reset selected brand when closing
    callback({ action: "close" });
  };

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:h-[90vh] tw:max-w-lg"
    >
      <AppModal.Title onClose={handleClose}>
        <h2 className="tw:text-xl tw:font-semibold tw:text-gray-900">
          Manage Vendor Brands
        </h2>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[80vh]">
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
            <AppSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-6">
            {vendorData && (
              <div className="tw:bg-gray-50 tw:p-4 tw:rounded-lg">
                <h3 className="tw:text-lg tw:font-medium tw:text-gray-900 tw:mb-2">
                  {vendorData.name}
                </h3>
                <div className="tw:space-y-1">
                  <p className="tw:text-xs tw:text-gray-500">
                    <span className="tw:font-medium">Vendor ID:</span>{" "}
                    {vendorData.vendorId || vendorData._id}
                  </p>
                  {vendorData.address && (
                    <div className="tw:text-xs tw:text-gray-500">
                      <span className="tw:font-medium">Address:</span>{" "}
                      {[
                        vendorData.address.town,
                        vendorData.address.district,
                        vendorData.address.state,
                        vendorData.address.postcode || vendorData.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="tw:space-y-4">
              <div>
                <div className="tw:flex tw:gap-3 tw:items-end tw:mb-4">
                  <div className="tw:flex-1">
                    <BrandSearchInput
                      vendorId={vendorId}
                      size="lg"
                      label={t("selectBrands")}
                      placeholder={
                        sourceAllBrands && !selectedBrand
                          ? "Source All Brands is enabled"
                          : t("searchAndSelectBrands")
                      }
                      multiSelect={false}
                      callback={handleBrandSelect}
                      values={selectedBrand ? [selectedBrand] : []}
                    />
                  </div>
                  <AppButton
                    type="button"
                    fill="solid"
                    color="primary"
                    onClick={handleAddBrand}
                    isLoading={submitting}
                  >
                    Add Brand
                  </AppButton>
                </div>
                <div className="tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-md tw:p-3 tw:flex tw:items-center tw:justify-between tw:gap-3">
                  <div className="tw:flex-1">
                    <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                      <p className="tw:text-sm tw:font-medium tw:text-amber-900">
                        {t("sourceAllBrands")}
                      </p>
                      {sourceAllBrands && (
                        <div className="tw:flex tw:items-center tw:gap-1 tw:text-green-600">
                          <Check className="tw:w-4 tw:h-4" />
                          <span className="tw:text-xs tw:font-medium">
                            Active
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="tw:text-xs tw:text-amber-700">
                      {sourceAllBrands
                        ? "All brands will be sourced for this vendor"
                        : "Enable to source from all brands (clears selected brands)"}
                    </p>
                  </div>
                  <div className="tw:flex-shrink-0">
                    {sourceAllBrands ? (
                      <AppButton
                        type="button"
                        fill="outline"
                        color="secondary"
                        onClick={() => {
                          appToast.show({
                            msg: "Add at least one brand",
                            color: "error",
                          });
                        }}
                        size="small"
                        disabled={submitting}
                      >
                        Disable
                      </AppButton>
                    ) : (
                      <AppButton
                        type="button"
                        fill="solid"
                        color="primary"
                        onClick={() => setShowConfirmSourceAll(true)}
                        size="small"
                      >
                        Enable
                      </AppButton>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Brands List */}
              {selectedBrands.length > 0 && !sourceAllBrands && (
                <div className="tw:space-y-2 tw:pb-8">
                  <h4 className="tw:text-sm tw:font-medium tw:text-gray-700">
                    Selected Brands ({selectedBrands.length})
                  </h4>
                  <AppScrollArea className="tw:max-h-52">
                    <div className="tw:space-y-2 tw:pr-2 tw:max-h-52">
                      {selectedBrands.map((brand) => (
                        <div
                          key={brand.value.id}
                          className="tw:flex tw:items-center tw:justify-between tw:bg-gray-50 tw:px-3 tw:py-2 tw:rounded-md tw:border"
                        >
                          <span className="tw:text-sm tw:text-gray-700">
                            {brand.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBrand(brand.value.id)}
                            className="tw:flex tw:items-center tw:justify-center tw:w-6 tw:h-6 tw:rounded-full tw:bg-red-100 tw:text-red-600 hover:tw:bg-red-200 tw:transition-colors"
                            title="Remove brand"
                          >
                            <Trash2 className="tw:w-3 tw:h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </AppScrollArea>
                </div>
              )}
            </div>
          </form>
        )}
      </AppModal.Content>
      {/* Confirm Source All Brands */}
      <AppAlertDialog
        show={showConfirmSourceAll}
        title={t("sourceAllBrands")}
        description={
          "Are you sure you want to enable sourcing from all brands? This will clear the manually selected brands."
        }
        okText="Yes, enable"
        cancelText="No"
        onCancel={() => setShowConfirmSourceAll(false)}
        onConfirm={() => {
          setValue("sourceAllBrands", true, {
            shouldDirty: true,
            shouldValidate: true,
          });
          setSelectedBrands([]);
          setShowConfirmSourceAll(false);
          onSubmit({ sourceAllBrands: true });
        }}
      />
    </AppModal>
  );
};

export default ManageVendorBrandModal;
