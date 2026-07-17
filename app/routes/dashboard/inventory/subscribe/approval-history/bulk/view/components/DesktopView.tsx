import React from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import { Eye, Mail } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import DealLinked from "../../../components/DealLinked";
import ProductDetails, { type ProductInfo } from "./ProductDetails";

interface DataRow {
  originalProduct: ProductInfo;
  finalProduct: ProductInfo;
  actionTaken: string;
  status: string;
  adminNotes: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  updatedByName?: string;
  statusColor?: string;
  statusLabel?: string;
  isLinkedExisting?: boolean;
  isLinkedNew?: boolean;
  isSubscribed?: boolean;
}

interface DesktopViewProps {
  data: DataRow[];
  callback?: (a: { action: string; data: Record<string, any> }) => void;
  loading?: boolean;
}

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  callback,
  loading = false,
}) => {
  const { t } = useTranslation(["common"]);

  const headers = [
    { label: t("originalProduct"), key: "originalProduct", width: "40%" },
    { label: t("status"), key: "status", width: "20%" },
    { label: t("adminNotes"), key: "adminNotes", width: "20%" },
    { label: t("action"), key: "action", width: "20%" },
  ];

  const containerStyle = {
    maxHeight: "calc(100vh - 200px)",
  };

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      container
      responsive
      fixedLayout
      minWidth="1000px"
      size="sm"
      containerStyle={containerStyle}
      stickyHeader
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>

      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} />
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length}>
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((item) => {
            return (
              <AppTable.Row key={item._id} className="tw:hover:bg-gray-50">
                {/* Original Product Column */}
                <AppTable.Cell>
                  <ProductDetails
                    product={item.originalProduct}
                    variant="desktop"
                  />
                </AppTable.Cell>

                {/* Status Column */}
                <AppTable.Cell>
                  <div className="tw:mb-1">
                    <AppBadge
                      variant={(item.statusColor as any) || "light"}
                      className="tw:text-xs"
                    >
                      {item.statusLabel || item.status || t("pending")}
                    </AppBadge>
                  </div>

                  <DealLinked
                    isLinkedExisting={item.isLinkedExisting}
                    isLinkedNew={item.isLinkedNew}
                  />
                </AppTable.Cell>

                {/* Admin Notes Column */}
                <AppTable.Cell>
                  <div>{item.adminNotes || "-"}</div>
                </AppTable.Cell>

                {/* Action Column */}
                <AppTable.Cell>
                  <div className="tw:flex tw:gap-2">
                    {(item.status === "Synced" ||
                      item.statusLabel === "Synced") &&
                      !item.isSubscribed && (
                        <AppButton
                          color="success"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            callback?.({ action: "subscribe", data: item });
                          }}
                        >
                          <Mail size={14} />
                          {t("subscribe")}
                        </AppButton>
                      )}
                    <AppButton
                      color="dark"
                      fill="outline"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        callback?.({ action: "view", data: item });
                      }}
                    >
                      <Eye size={14} />
                      {t("view")}
                    </AppButton>
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
