import { Calendar, Eye, Mail, MapPin, Navigation, Phone } from "lucide-react";
import React, { use } from "react";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { SortProps, TableHeaderItem } from "~/types/CommonTypes";
import AddressInfo from "./AddressInfo";
import { useTranslation } from "react-i18next";

interface DesktopViewProps {
  loading?: boolean;
  data: any[];
  sortKey?: string;
  sortValue?: "asc" | "desc";
  onSort?: (data: SortProps) => void;
}

const headers: TableHeaderItem[] = [
  {
    label: "Seller Name",
    key: "name",
    langKey: "sellerName",
    enableSort: true,
    width: "20%",
  },
  {
    label: "Contact",
    langKey: "contact",
    key: "contact",
    width: "20%",
  },
  {
    label: "Location",
    key: "location",
    langKey: "location",
    enableSort: false,
    width: "24%",
  },
  {
    label: "Action",
    key: "action",
    langKey: "action",
    enableSort: false,
    width: "10%",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  sortKey,
  sortValue,
  onSort,
}) => {
  const { t } = useTranslation(["common"]);

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
        <TableHeader
          headers={headers}
          onSort={onSort}
          sortKey={sortKey}
          sortValue={sortValue}
        />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={30} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:gap-0.5">
                  <AppLink
                    asLink
                    href={`/dashboard/network/view/sk-seller/${row._id}`}
                    className="tw:font-medium tw:inline-block"
                  >
                    {row.name || "-"}
                  </AppLink>
                  <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                    <Calendar size={12} />
                    Registered On:
                  </div>
                  <div className="tw:text-xs tw:text-slate-600">
                    <DateFormat value={row.createdAt} />
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-1">
                  <Phone size={12} />
                  {row.mobile || "-"}
                </div>
                {row.email && (
                  <div className="tw:flex tw:items-center tw:gap-1 tw:mt-1">
                    <Mail size={12} />
                    {row.email}
                  </div>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <AddressInfo
                  address={row._address}
                  city={row.city}
                  district={row.district}
                  state={row.state}
                  pincode={row.pincode}
                  distanceKm={row.distanceKm}
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <AppLink
                  asLink
                  href={`/dashboard/network/view/sk-seller/${row._id}`}
                  noUnderline={true}
                >
                  <AppButton
                    size="small"
                    color="primary"
                    fill="outline"
                    className="tw:flex tw:items-center tw:gap-1"
                  >
                    <Eye className="tw:w-3 tw:h-3" />
                    {t("viewDetails")}
                  </AppButton>
                </AppLink>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
