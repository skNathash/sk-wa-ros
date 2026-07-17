import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import AuthService from "~/services/AuthService";

export const getData = async (id: string) => {
  try {
    if (!id) {
      return null;
    }

    const skSellerResponse = await FranchiseService.fetchSkSellers({
      filter: {
        _id: id,
      },
    });

    const sellerData = skSellerResponse?.data?.data?.skSellers?.[0];

    if (sellerData?._id) {
      const fid = sellerData?._id || id;
      const franResponse = await FranchiseService.getFranchise(fid);

      const franData = franResponse?.data?.data;

      if (franData?._id) {
        const reqStatusResp = await FranchiseService.getNetworkStatus(id);
        const reqStatus = reqStatusResp?.data?.data;

        const sellerLat =
          typeof sellerData?.latitude === "number"
            ? sellerData.latitude
            : franData?.lat;
        const sellerLng =
          typeof sellerData?.longitude === "number"
            ? sellerData.longitude
            : franData?.lng;

        const myLatLng = AuthService.getLoggedInUserLatLng();

        return {
          ...franResponse.data?.data,
          skBuyersCount: sellerData?.skBuyersCount,
          request: {
            status: reqStatus?.networkRequest?.status,
            requestMessage: reqStatus?.networkRequest?.requestMessage,
            responseMessage: reqStatus?.networkRequest?.responseMessage,
            createdAt: reqStatus?.networkRequest?.createdAt,
            approvedAt: reqStatus?.networkRequest?.approvedAt,
          },
          lat: sellerLat,
          lng: sellerLng,
          distanceKm: CommonService.roundedByDecimalPlace(
            sellerData?.distanceKm,
            2
          ),
          _address: [
            "addressLine1",
            "addressLine2",
            "city",
            "district",
            "state",
            "pincode",
          ]
            .map((key) => franData?.[key])
            .filter(Boolean)
            .join(", "),
          map: {
            orig: {
              lat: myLatLng?.lat,
              lng: myLatLng?.lng,
            },
            dest: {
              lat: sellerLat,
              lng: sellerLng,
            },
          },
        };
      } else {
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching seller data:", error);
    throw error;
  }
};
