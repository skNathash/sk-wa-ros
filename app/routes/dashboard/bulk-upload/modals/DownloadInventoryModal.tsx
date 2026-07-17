import { useState, useCallback, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { AppSelect } from "~/components/core/form/AppSelect";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import { Download, Package, Search } from "lucide-react";
import SellerCatalogService from "~/services/SellerCatalogService";
import { ReportService } from "~/services/ReportService";
import { prepareParams, getCount } from "./helper";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";

interface FilterFormData {
  search: string;
  category: any[];
  brand: any[];
  velocity: string;
}

interface DownloadInventoryModalProps {
  show: boolean;
  callback: (action: { action: string }) => void;
  feature?: string;
  showDealIds?: boolean;
}

const DownloadInventoryModal = ({
  show,
  callback,
  feature,
  showDealIds,
}: DownloadInventoryModalProps) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const [dealIds, setDealIds] = useState("");
  const hasDealIds = showDealIds && dealIds.trim().length > 0;
  const parsedDealIds = dealIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [countLoading, setCountLoading] = useState(false);

  const velocityOptions = [
    { value: "All", label: t("allVelocities") },
    { value: "Fast-Moving", label: t("fastMovingLabel") },
    { value: "Normal", label: t("normalMoving") },
    { value: "Slow-Moving", label: t("slowMovingLabel") },
    { value: "Non-Moving", label: t("nonMovingLabel") },
    { value: "outOfStock", label: t("outOfStockLabel") },
    { value: "nearExpiry", label: t("nearExpiryLabel") },
    { value: "newStock", label: t("newStock") },
  ];

  const { control, setValue, getValues, register, reset } =
    useForm<FilterFormData>({
      defaultValues: {
        search: "",
        category: [],
        brand: [],
        velocity: "All",
      },
    });

  // Watch form values for changes
  const [category, brand] = useWatch({
    control,
    name: ["category", "brand"],
  });

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      reset({
        search: "",
        category: [],
        brand: [],
        velocity: "All",
      });
      setDealIds("");
      fetchCount();
    }
  }, [show, reset]);

  // Fetch total count based on current filters
  const fetchCount = useCallback(async () => {
    try {
      setCountLoading(true);
      const params = prepareParams(
        getValues(),
        {
          activePage: 1,
          rowsPerPage: 1,
          startSlNo: 1,
          endSlNo: 1,
          totalRecords: 0,
        },
        undefined,
      );

      let count = 0;
      if (feature) {
        const franchiseId = AuthService.getLoggedInUserId();
        const p: any = { ...params };
        delete p.page;
        delete p.count;
        count = await ReportService.getStockMastersCount(franchiseId, feature, p);
      } else {
        count = await getCount(params);
      }
      setTotalCount(count);
    } catch (error) {
      console.error("Error fetching count:", error);
      setTotalCount(0);
    } finally {
      setCountLoading(false);
    }
  }, [getValues, feature]);

  // Debounced fetch (keeps same behavior as previous search debounce)
  const debouncedFetch = useCallback(
    debounce(() => {
      fetchCount();
    }, 500),
    [fetchCount],
  );

  // Handle category selection
  const handleCategoryChange = (item: any, action: "add" | "remove") => {
    const currentCategories = getValues("category") || [];
    if (action === "add") {
      const updatedCategories = [...currentCategories, item];
      setValue("category", updatedCategories);
    } else {
      const updatedCategories = currentCategories.filter(
        (cat: any) => cat.value?.id !== item.value?.id,
      );
      setValue("category", updatedCategories);
    }
    fetchCount();
  };

  // Handle brand selection
  const handleBrandChange = (item: any, action: "add" | "remove") => {
    const currentBrands = getValues("brand") || [];
    if (action === "add") {
      const updatedBrands = [...currentBrands, item];
      setValue("brand", updatedBrands);
    } else {
      const updatedBrands = currentBrands.filter(
        (brand: any) => brand.value?.id !== item.value?.id,
      );
      setValue("brand", updatedBrands);
    }
    fetchCount();
  };

  // Handle velocity change
  const handleVelocityChange = (chngFn: any) => (value: string) => {
    chngFn(value);
    fetchCount();
  };

  // Build download params by reusing prepareParams and removing pagination keys
  const buildDownloadParams = (): Record<string, any> | undefined => {
    let params = prepareParams(
      getValues(),
      {
        activePage: 1,
        rowsPerPage: 1,
        startSlNo: 1,
        endSlNo: 1,
        totalRecords: 0,
      },
      undefined,
    );

    if (params) {
      const p: any = { ...params };
      delete p.page;
      delete p.count;
      return p;
    }
    return undefined;
  };

  // Handle download
  const handleDownload = async () => {
    try {
      setLoading(true);

      if (hasDealIds) {
        const userId = AuthService.getLoggedInUserId();
        const featureParams: Record<string, any> = {};
        featureParams.filter = JSON.stringify({
          dealRefId: { $in: parsedDealIds },
        });
        ReportService.getStockMastersReport(userId, feature!, featureParams);
      } else if (feature) {
        const params = buildDownloadParams();
        const userId = AuthService.getLoggedInUserId();
        ReportService.getStockMastersReport(userId, feature, params || {});
      } else {
        const params = buildDownloadParams();
        SellerCatalogService.downloadProducts(params);
      }

      appToast.show({ msg: "Download started successfully", color: "success" });
      callback({ action: "close" });
    } catch (error) {
      console.error("Error downloading inventory:", error);
      appToast.show({ msg: "Failed to download inventory", color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <Download size={20} />
          Download Inventory
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:space-y-6">
          {/* Search input removed - filters: Brand (required), Category (filtered by brand), Velocity */}

          {showDealIds && (
            <div>
              <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-1">
                Deal IDs
              </label>
              <input
                type="text"
                className="tw:w-full tw:border tw:border-gray-300 tw:rounded-md tw:px-3 tw:py-2 tw:text-sm tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-blue-500"
                placeholder="Enter comma separated deal IDs"
                value={dealIds}
                onChange={(e) => setDealIds(e.target.value)}
              />
            </div>
          )}

          {!hasDealIds && (
            <>
              {/* Filter Options */}
              <div className="tw:space-y-4">
                <div>
                  <BrandSearchInput
                    label="Brands"
                    multiSelect={true}
                    callback={handleBrandChange}
                    values={brand || []}
                    feature="pos"
                    placeholder="Search and select multiple brands..."
                    size="sm"
                  />
                </div>

                {/* Category Search */}
                <div>
                  <CategorySearchInput
                    label="Categories"
                    multiSelect={true}
                    callback={handleCategoryChange}
                    values={category || []}
                    feature="pos"
                    placeholder="Search and select multiple categories..."
                    size="sm"
                    params={
                      brand && Array.isArray(brand) && brand.length > 0
                        ? {
                            filter: {
                              "applicableBrand.brandId": {
                                $in: brand
                                  .map((b: any) => b.value?.id)
                                  .filter((id: any) => id),
                              },
                            },
                          }
                        : undefined
                    }
                  />
                </div>
              </div>

              {/* Velocity Select */}
              <div>
                <Controller
                  name="velocity"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      label="Stock Movement Type"
                      options={velocityOptions}
                      placeholder="Select movement type"
                      onChange={handleVelocityChange(field.onChange)}
                      value={field.value}
                      inputClassName="tw:w-full"
                    />
                  )}
                />
              </div>
            </>
          )}

          {/* Total Count Display */}
          <div className="tw:bg-gray-50 tw:p-4 tw:rounded-lg tw:border">
            <div className="tw:flex tw:items-center tw:gap-2">
              <Package size={20} className="tw:text-blue-500" />
              <div>
                <div className="tw:text-sm tw:font-medium tw:text-gray-700">
                  Total Products
                </div>
                <div className="tw:text-2xl tw:font-bold tw:text-gray-900">
                  {hasDealIds ? (
                    parsedDealIds.length.toLocaleString()
                  ) : countLoading ? (
                    <div className="tw:animate-pulse tw:bg-gray-200 tw:h-8 tw:w-16 tw:rounded"></div>
                  ) : (
                    totalCount.toLocaleString()
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-3">
          <AppButton
            color="light"
            fill="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </AppButton>
          <AppButton
            color="primary"
            onClick={handleDownload}
            isLoading={loading}
            disabled={
              hasDealIds
                ? parsedDealIds.length === 0
                : countLoading || totalCount === 0
            }
          >
            <Download size={16} />
            Download (
            {hasDealIds
              ? parsedDealIds.length.toLocaleString()
              : totalCount.toLocaleString()}
            )
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default DownloadInventoryModal;
