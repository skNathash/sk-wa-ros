import { useEffect, useState } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AuthService from "~/services/AuthService";
import PaylaterService from "~/services/PaylaterService";
import KeyValue from "~/components/core/key-value/KeyValue";
import Divider from "~/components/core/divider/Divider";
import ImgRender from "~/components/core/img/ImgRender";
import DocumentItem from "./components/DocumentItem";

const getKycData = async (userId: string) => {
  const response = await PaylaterService.getRequests({
    filter: {
      "userInfo.id": userId,
      "franchiseInfo.id": AuthService.getLoggedInUserId(),
    },
  });
  return response.data?.data?.[0] || null;
};
const NetworkKyc = ({ userId }: { userId: string }) => {
  const [kycData, setKycData] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        setLoading(true);
        const data = await getKycData(userId);
        setKycData(data);
        setLoading(false);
      };
      fetchData();
    } else {
      setKycData(null);
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
        <AppSpinner />
      </div>
    );
  }

  if (!kycData) {
    return <NoData />;
  }

  // Normalize nominees to always be an array
  const nominees = Array.isArray(kycData?.NomineeDetails)
    ? kycData.NomineeDetails
    : kycData?.NomineeDetails
      ? [kycData.NomineeDetails]
      : [];

  const userInfo = kycData?.userInfo || {};
  const franchiseInfo = kycData?.franchiseInfo || {};

  const formattedAddress = [
    "doorNo",
    "street",
    "city",
    "district",
    "state",
    "postcode",
  ]
    .map((key) => userInfo?.address?.[key])
    .filter(Boolean)
    .join(", ");

  const kycStatusColor =
    kycData?.kycStatus === "Approved"
      ? "success"
      : kycData?.kycStatus === "Pending"
        ? "warning"
        : kycData?.kycStatus === "Rejected" ||
            kycData?.kycStatus === "Cancelled"
          ? "danger"
          : "default";

  return (
    <>
      <AppCard>
        {/* personal details */}
        <div className="tw:mb-4">
          <div className="tw:text-base tw:font-semibold">Personal Details</div>
          <div className="tw:text-xs tw:text-gray-500">
            KYC personal information of the user
          </div>
        </div>

        <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
          <KeyValue label="Name" size="sm">
            <div className="tw:flex tw:items-center tw:gap-2">
              {userInfo?.photo ? (
                <ImgRender
                  assetId={userInfo.photo}
                  alt="User"
                  className="tw:w-8 tw:h-8 tw:rounded-full tw:object-cover"
                />
              ) : null}
              <span>{userInfo?.name || "N/A"}</span>
            </div>
          </KeyValue>

          <KeyValue label="Mobile" size="sm">
            {userInfo?.mobile || "N/A"}
          </KeyValue>

          {userInfo?.alternatePhone ? (
            <KeyValue label="Alternate Phone" size="sm">
              {userInfo.alternatePhone}
            </KeyValue>
          ) : null}

          {userInfo?.email ? (
            <KeyValue label="Email" size="sm">
              {userInfo.email}
            </KeyValue>
          ) : null}

          {userInfo?.gender ? (
            <KeyValue label="Gender" size="sm">
              {userInfo.gender}
            </KeyValue>
          ) : null}

          {userInfo?.dob ? (
            <KeyValue label="Date of Birth" size="sm">
              <DateFormat value={userInfo.dob} formatStr="dd MMM yyyy" />
            </KeyValue>
          ) : null}

          {userInfo?.age ? (
            <KeyValue label="Age" size="sm">
              {userInfo.age}
            </KeyValue>
          ) : null}

          {userInfo?.occupation ? (
            <KeyValue label="Occupation" size="sm">
              {userInfo.occupation}
            </KeyValue>
          ) : null}

          {formattedAddress ? (
            <KeyValue label="Address" size="sm" className="tw:col-span-2">
              {formattedAddress}
            </KeyValue>
          ) : null}

          {kycData?.vehicleInfo?.length > 0 ? (
            <KeyValue label="Vehicle Info" size="sm" className="tw:col-span-2">
              {kycData.vehicleInfo.map((v: any, i: number) => (
                <span key={i}>
                  {v.vehileName || v.vehicleName}
                  {v.vehicleNo ? ` - ${v.vehicleNo}` : ""}
                  {i < kycData.vehicleInfo.length - 1 ? ", " : ""}
                </span>
              ))}
            </KeyValue>
          ) : null}
        </div>

        <Divider />

        {/* credit / approval details */}
        <div className="tw:mb-4">
          <div className="tw:text-base tw:font-semibold">Approval Details</div>
          <div className="tw:text-xs tw:text-gray-500">
            Credit limit and approval information
          </div>
        </div>

        <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
          <KeyValue label="KYC Status" size="sm">
            <AppBadge variant={kycStatusColor}>
              {kycData?.kycStatus || "N/A"}
            </AppBadge>
          </KeyValue>

          <KeyValue label="Approved Limit" size="sm">
            {kycData?.approvedLimit ?? kycData?.creditLimit ?? "N/A"}
          </KeyValue>

          <KeyValue label="Validity Period" size="sm">
            {kycData?.validityPeriod || "N/A"}
          </KeyValue>

          {kycData?.reason ? (
            <KeyValue label="Reason" size="sm">
              {kycData.reason}
            </KeyValue>
          ) : null}
        </div>

        {franchiseInfo?.name ? (
          <>
            <Divider />
            <div className="tw:mb-4">
              <div className="tw:text-base tw:font-semibold">
                Franchise Details
              </div>
              <div className="tw:text-xs tw:text-gray-500">
                Details of the franchise who assigned paylater
              </div>
            </div>
            <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
              <KeyValue label="Franchise Name" size="sm">
                {franchiseInfo.name}
              </KeyValue>
              {franchiseInfo.subType ? (
                <KeyValue label="Type" size="sm">
                  {franchiseInfo.subType}
                </KeyValue>
              ) : null}
            </div>
          </>
        ) : null}

        <Divider />

        {/* nominee details */}
        <div className="tw:mb-4">
          <div className="tw:text-base tw:font-semibold">Nominee Details</div>
          <div className="tw:text-xs tw:text-gray-500">
            Details of the nominee(s) who requested for paylater
          </div>
        </div>

        {nominees.length === 0 ? (
          <div className="tw:text-center tw:text-gray-500 tw:py-4">
            No nominee details available
          </div>
        ) : (
          nominees.map((nominee: any, index: number) => (
            <div key={index} className="tw:mb-4">
              {nominees.length > 1 && (
                <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-2">
                  Nominee {index + 1}
                </div>
              )}
              <div className="tw:grid tw:grid-cols-2 tw:gap-4">
                <KeyValue label="Nominee Name" size="sm">
                  {nominee?.name || "N/A"}
                  {nominee?.relationShip && (
                    <span className="tw:text-xs tw:text-gray-500 tw:uppercase tw:ml-2">
                      {nominee.relationShip}
                    </span>
                  )}
                </KeyValue>

                <KeyValue label="Nominee Mobile" size="sm">
                  {nominee?.mobile || "N/A"}
                </KeyValue>
              </div>
            </div>
          ))
        )}

        <Divider />

        {/* document details */}
        <div className="tw:mb-4">
          <div className="tw:text-base tw:font-semibold">Document Details</div>
          <div className="tw:text-xs tw:text-gray-500">
            Details of the documents uploaded by the user
          </div>
        </div>

        {!kycData?.otherDocuments ||
        (Array.isArray(kycData.otherDocuments) &&
          kycData.otherDocuments.length === 0) ? (
          <div className="tw:text-center tw:text-gray-400 tw:text-sm tw:py-6 tw:bg-gray-50 tw:rounded-lg tw:border tw:border-dashed tw:border-gray-200">
            No additional documents uploaded
          </div>
        ) : (
          <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-3">
            {Array.isArray(kycData.otherDocuments) &&
              kycData.otherDocuments.map((doc: any, index: number) => (
                <DocumentItem
                  key={doc.id || index}
                  title={doc.type || "Document"}
                  front={doc.frontImage || ""}
                  back={doc.backImage || ""}
                  refNo={doc.id || ""}
                />
              ))}
          </div>
        )}
      </AppCard>
    </>
  );
};

export default NetworkKyc;
