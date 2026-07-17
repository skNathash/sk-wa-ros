import { Phone, Eye, Mail, Calendar } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import UserPic from "~/shared/users/components/UserPic";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";

import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

interface CustomerData {
  _id: string;
  referenceId: string;
  name: string;
  mobile: string;
  email?: string;
  registeredFrom: string;
  status: string;
  createdAt: string;
  dateOfRegistration: string;
  franchiseInfo: {
    id: string;
    name: string;
  };
  address: {
    city: string;
    state: string;
    postcode?: string;
  };
  formattedAddress: string;
  initials: string;
  profileImages?: string[];
  gender?: string;
  routes?: { description?: string; routeCode?: string }[];
  lastOrderDate?: string;
}

interface DesktopViewProps {
  loading?: boolean;
  data: CustomerData[];
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  onAction?: (arg: { action: string; data?: any }) => void;
}

const headers = [
  {
    label: "Customer",
    langKey: "customer",
    key: "customer",
    enableSort: false,
    width: "22%",
  },
  {
    label: "Last Order Date",
    langKey: "lastOrderDate",
    key: "lastOrderDate",
    enableSort: false,
    width: "15%",
  },
  {
    label: "Actions",
    langKey: "actions",
    key: "actions",
    enableSort: false,
    width: "18%",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  onAction,
}) => {
  const { t } = useTranslation(["common"]);

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      minWidth="1000px"
      containerStyle={containerStyle}
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={30} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => {
            return (
              <AppTable.Row key={row._id || idx}>
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-3">
                    <UserPic
                      assetId={row.profileImages?.[0]}
                      gender={row.gender}
                      type="b2c"
                      alt={row.name}
                      className="tw:w-10 tw:h-10 tw:rounded-full tw:object-cover"
                      size="40"
                    />
                    <div>
                      <div className="tw:font-medium">
                        <AppLink
                          asLink
                          href={`/dashboard/network/view/b2c/${row._id}`}
                        >
                          {row.name}
                        </AppLink>
                      </div>
                      <div className="tw:text-xs tw:text-gray-500">
                        {row.email ? (
                          <span className="tw:flex tw:items-center tw:gap-1">
                            <Mail size={10} /> {row.email}
                          </span>
                        ) : null}
                        {row.mobile ? (
                          <span className="tw:flex tw:items-center tw:gap-1">
                            <Phone size={10} /> {row.mobile}
                          </span>
                        ) : null}
                        <span className="tw:flex tw:items-center tw:gap-1 tw:mt-0.5">
                          <Calendar size={10} />
                          <span>{t("registeredOn")}:</span>
                          <DateFormat
                            value={row.dateOfRegistration || row.createdAt}
                            formatStr="dd MMM yyyy"
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <span className="tw:text-xs tw:text-gray-700 tw:font-medium">
                    {row.lastOrderDate ? (
                      <DateFormat
                        value={row.lastOrderDate}
                        formatStr="dd MMM yyyy"
                      />
                    ) : (
                      t("nA")
                    )}
                  </span>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <AppLink
                      title={t("viewDetails")}
                      asLink
                      href={`/dashboard/network/view/b2c/${row._id}`}
                    >
                      <Eye size={16} />
                    </AppLink>
                    <AppButton
                      title="Promote"
                      fill="outline"
                      size="small"
                      className="tw:flex tw:items-center tw:gap-1 tw:border-green-500 tw:text-green-600 hover:tw:bg-green-50 hover:tw:text-green-600 tw:px-2 tw:py-1"
                      onClick={() =>
                        onAction?.({ action: "openWhatsapp", data: row })
                      }
                    >
                      <ImgRender
                        src="whatsapp-logo.png"
                        className="tw:w-4 tw:h-4"
                        alt="WhatsApp"
                      />
                      <span className="tw:text-xs tw:font-medium tw:whitespace-nowrap">Promote via WhatsApp</span>
                    </AppButton>
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              {t("noDataFoundMessage")}
            </AppTable.Cell>
          </AppTable.Row>
        )}
        {hasMoreData && !loading && data.length > 0 && (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={totalCount}
                loadedCount={loadedCount}
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
