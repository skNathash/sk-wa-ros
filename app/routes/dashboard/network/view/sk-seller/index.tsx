import { MapPin, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import GMapTwoPoint from "~/components/core/map-two-point/GMapTwoPoint";
import NoData from "~/components/core/no-data/NoData";
import PageLoader from "~/components/core/page-loader/PageLoader";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import ViewMyClubModal from "~/shared/store/view-my-club/ViewMyClubModal";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import BasicInfo from "./components/info/BasicInfo";
import RequestStatus from "./components/RequestStatus";
import { getData } from "./helper";
import JoinRemarksModal from "./modals/JoinRemarksModal";
import { useTranslation } from "react-i18next";
import { CLUB_STORE_URL } from "~/constants";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "StoreKing Sellers",
    langKey: "storeKingSellers",
    redirect: { path: "/dashboard/network" },
  },
];

const SKSellerView = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showJoinModal, setShowJoinModal] = useState(false);

  const [showQrModal, setShowQrModal] = useState(false);

  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: Array<{ id: string; url: string }>;
  }>({
    show: false,
    images: [],
  });

  const fetchSellerData = useCallback(async () => {
    try {
      if (!id) {
        setLoading(false);
        setSeller(null);
        return;
      }

      setLoading(true);
      const sellerData = await getData(id);
      setSeller(sellerData);
    } catch (error) {
      console.error("Error fetching seller data:", error);
      setSeller(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSellerData();
  }, [fetchSellerData]);

  const handleSellerAction = (action: {
    type: "join" | "disconnect";
    sellerId: string;
  }) => {
    if (action.type === "join") {
      // TODO: Implement join API call
      // Example: await FranchiseService.joinSeller(action.sellerId);
    } else {
      // TODO: Implement disconnect API call
      // Example: await FranchiseService.disconnectSeller(action.sellerId);
    }
  };

  const handleJoinClick = () => {
    setShowJoinModal(true);
  };

  const handleQrCodeClick = () => {
    setShowQrModal(true);
  };

  const handleImageClick = () => {
    const images =
      seller?.shopPhotosDetails?.map((photo: any) => ({
        id: photo.fileUrl,
        url: photo.fileUrl,
      })) || [];

    setImgPreviewModal({
      show: true,
      images: images,
    });
  };

  const handleImgPreviewModalCallback = (action: {
    action: string;
    data?: any;
  }) => {
    if (action.action === "close") {
      setImgPreviewModal((prev) => ({
        ...prev,
        show: false,
      }));
    }
  };

  const handleJoinModalCallback = async (action: {
    action: string;
    remarks?: string;
  }) => {
    if (action.action === "close") {
      setShowJoinModal(false);
    } else if (action.action === "submit") {
      setShowJoinModal(false);
      await fetchSellerData();
    }
  };

  const renderMap = () => {
    if (
      seller?.map?.orig?.lat &&
      seller?.map?.orig?.lng &&
      seller?.map?.dest?.lat &&
      seller?.map?.dest?.lng
    ) {
      return (
        <AppCard title={t("locationMap")} className="tw:mb-4">
          <div className="tw:space-y-3">
            {/* Legend */}
            <div className="tw:flex tw:items-center tw:gap-6 tw:justify-center tw:bg-gray-50 tw:py-3 tw:px-4 tw:rounded-lg">
              <div className="tw:flex tw:items-center tw:gap-2">
                <MapPin className="tw:w-4 tw:h-4 tw:text-green-500" />
                <span className="tw:text-sm tw:font-medium tw:text-gray-700">
                  {t("sellerLocation")}
                </span>
              </div>
              <div className="tw:flex tw:items-center tw:gap-2">
                <User className="tw:w-4 tw:h-4 tw:text-red-500" />
                <span className="tw:text-sm tw:font-medium tw:text-gray-700">
                  {t("yourLocation")}
                </span>
              </div>
            </div>

            {/* Map */}
            <GMapTwoPoint
              className="tw:w-full tw:h-80 tw:rounded-md tw:overflow-hidden"
              origLat={seller.map.orig.lat}
              origLng={seller.map.orig.lng}
              destLat={seller.map.dest.lat}
              destLng={seller.map.dest.lng}
              mapTypeId="terrain"
            />
          </div>
        </AppCard>
      );
    }
    return null;
  };

  const renderRequestStatus = () => <RequestStatus request={seller?.request} />;

  return (
    <>
      <AppHeader title={t("storeKingSellerDetails")} />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container tw:space-y-4">
          <div>
            <AppBreadcrumbs data={breadcrumbs} />
            <div className="tw:text-gray-500 tw:text-xs">
              {loading
                ? t("loadingSellerDetails")
                : !seller
                  ? t("sellerNotFound")
                  : ""}
            </div>
          </div>

          {loading ? (
            <div className="tw:flex tw:items-center tw:justify-center tw:h-64">
              <PageLoader message={t("loadingSellerDetails")} size="md" />
            </div>
          ) : !seller ? (
            <div className="tw:flex tw:items-center tw:justify-center tw:h-64">
              <NoData>
                <div className="tw:text-gray-500">
                  {t("noSellerDataAvailable")}
                </div>
              </NoData>
            </div>
          ) : (
            <>
              {renderRequestStatus()}
              {/* Seller Basic Information */}
              <BasicInfo
                data={seller}
                callback={handleSellerAction}
                onJoinClick={handleJoinClick}
                onQrCodeClick={handleQrCodeClick}
                onImageClick={handleImageClick}
              />

              {renderMap()}

              {/* <Brands sellerId={seller.id} />

              <Products sellerId={seller.id} /> */}
            </>
          )}
        </div>
      </div>

      {/* Join Remarks Modal */}
      <JoinRemarksModal
        show={showJoinModal}
        sellerName={seller?.name}
        sellerId={seller?._id}
        callback={handleJoinModalCallback}
      />

      {/* QR Code Modal */}
      <ViewMyClubModal
        show={showQrModal}
        onClose={() => {
          setShowQrModal(false);
        }}
        title={`${seller?.name || "Seller"} Store QR`}
        value={`${CLUB_STORE_URL}${seller?.mobile || ""}`}
        linkUrl={`${CLUB_STORE_URL}${seller?.mobile || ""}`}
      />

      {/* Image Preview Modal */}
      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={handleImgPreviewModalCallback}
        images={imgPreviewModal.images}
      />
    </>
  );
};

export default SKSellerView;
