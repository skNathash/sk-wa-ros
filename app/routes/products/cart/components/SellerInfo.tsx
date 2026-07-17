import { Phone, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";

const SellerInfo = ({ retailerId }: { retailerId?: string }) => {
  const { t } = useTranslation();

  const isBuyer = AuthService.isBuyerUser();

  const linkedFranchise = AuthService.getLinkedSeller();

  const [sellerInfo, setSellerInfo] = useState<any>(null);

  useEffect(() => {
    let id = linkedFranchise?._id;
    if (retailerId) {
      id = retailerId;
    }

    if (id) {
      const fetchSellerInfo = async () => {
        const response = await FranchiseService.getFranchise(id);

        setSellerInfo(response.data?.data);
      };
      fetchSellerInfo();
    }
  }, [linkedFranchise?._id, retailerId]);

  if (!isBuyer && !retailerId) {
    return null;
  }

  return (
    <>
      <div className="tw:text-base tw:font-semibold tw:mb-1">{t("soldBy")}</div>
      <AppCard>
        <div className="tw:grid tw:grid-cols-2 tw:gap-4">
          <KeyValue label={t("name")} size="sm">
            <div className="tw:mb-1">{sellerInfo?.name}</div>
            <div className="tw:flex tw:gap-1 tw:text-gray-500 tw:items-center tw:text-xs">
              <Phone size={14} />
              {sellerInfo?.mobile}
            </div>
          </KeyValue>

          <KeyValue label={t("address")} size="sm" className="tw:col-span-2">
            {[
              sellerInfo?.addressLine1,
              sellerInfo?.addressLine2,
              sellerInfo?.city,
              sellerInfo?.state,
              sellerInfo?.pincode,
            ]
              .filter(Boolean)
              .join(", ")}
          </KeyValue>
        </div>
      </AppCard>
    </>
  );
};

export default SellerInfo;
