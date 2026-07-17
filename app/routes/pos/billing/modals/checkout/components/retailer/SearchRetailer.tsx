import { debounce } from "lodash";
import { Store, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import FranchiseService from "~/services/FranchiseService";

const SearchRetailer = () => {
  const { t } = useTranslation(["posbilling"]);
  const { register, getValues, setValue, control } = useFormContext();
  const [searching, setSearching] = useState(false);
  const [noDataFound, setNoDataFound] = useState(false);
  const [retailer] = useWatch({ control, name: ["retailer"] });

  const handleSearch = useCallback(
    debounce(async () => {
      const search = getValues("retailerMobile");
      setValue("retailer", null);
      setNoDataFound(false);

      if (search) {
        setSearching(true);
        const response = await FranchiseService.getFranchiseNetwork({
          search: search,
        });
        const data = response.data?.data || [];
        if (data.length > 0) {
          // Transform to customerInfo structure for retailer
          const r = data[0];
          const retailerInfo = {
            customerType: "Retailer",
            name: r.name || r.ownerDetails?.name || "",
            _id: r._id,
            mobile: r.mobile || r.ownerDetails?.mobile || "",
            email: r.email || "",
            address: {
              city: r.city || r.town || "",
              state: r.state || "",
              district: r.district || "",
              pincode: r.pincode || "",
            },
            kycStatus: r.kycStatus?.overallStatus || "",
            lastLogin: r.lastLogin || "",
            createdAt: r.createdAt || "",
            status: r.status || "",
            profileImage: r.profileImage || "",
          };
          setValue("retailer", retailerInfo);
        } else {
          setNoDataFound(true);
        }
        setSearching(false);
      }
    }, 500),
    [getValues]
  );

  const handleClear = () => {
    setValue("retailerMobile", "");
    setValue("retailer", null);
    setNoDataFound(false);
  };

  return (
    <div className="tw:px-0.5">
      <AppInput
        placeholder={t("checkoutModal.retailer.search.placeholder")}
        register={register}
        name="retailerMobile"
        onChange={handleSearch}
        size="lg"
        autoFocus={true}
      />
      {searching && (
        <div className="tw:text-sm tw:text-gray-500 tw:mt-2">
          {t("checkoutModal.retailer.search.searching")}
        </div>
      )}
      {noDataFound && (
        <div className="tw:text-sm tw:text-gray-500 tw:mt-2">
          {t("checkoutModal.retailer.search.noDataFound")}
        </div>
      )}
      {retailer && (
        <div className="tw:border tw:rounded-md tw:p-4 tw:mt-4 tw:bg-blue-50 tw:border-blue-200 tw:text-blue-700 tw:text-sm">
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:font-semibold tw:text-blue-900">
              {retailer?.name}
            </div>
            <AppButton size="small" fill="clear" onClick={handleClear}>
              <X size={16} />
            </AppButton>
          </div>
          <div className="tw:text-xs tw:flex tw:gap-1 tw:items-center tw:mb-1">
            <Store size={12} /> {retailer?.mobile}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchRetailer;
