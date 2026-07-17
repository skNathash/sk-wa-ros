import { Trash2 } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import AppButton from "~/components/core/button/AppButton";
import { AppSelect } from "~/components/core/form";
import ImgRender from "~/components/core/img/ImgRender";
import { AppTable } from "~/components/core/table";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type { TableHeaderItem } from "~/types/CommonTypes";

const headers: TableHeaderItem[] = [
  { label: "Image", key: "image", width: "10%" },
  {
    label: "Product Detail",
    key: "productDetail",
    width: "30%",
  },
  { label: "MRP", key: "mrp", width: "15%" },
  { label: "Total Stock", key: "currentStock", width: "15%" },
  {
    label: "Enable Reserve",
    key: "enableReserve",
    width: "20%",
  },
  { label: "Actions", key: "actions", width: "10%", isCentered: true },
];

const reserveOptions = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

type Props = {
  callback: (args: { action: string; data?: any }) => void;
  loading: boolean;
  animateApply?: boolean;
  products: any[];
};

const DesktopView = ({ callback, loading, animateApply, products }: Props) => {
  return (
    <AppTable>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={12} />
        ) : null}
        {products.map((item: any, index: number) => {
          return (
            <AppTable.Row
              key={item._id}
              id={`item-${index}`}
              className={
                animateApply
                  ? "animate__animated animate__pulse animate__infinite tw:bg-blue-50/50"
                  : ""
              }
            >
              <AppTable.Cell className="tw:py-4">
                <ImgRender
                  assetId={item.dealInfo?.images?.[0]}
                  alt={item.dealInfo?.dealName}
                  size="60x60"
                  className="tw:w-16 tw:h-16 tw:object-contain tw:bg-gray-100 tw:rounded"
                />
              </AppTable.Cell>
              <AppTable.Cell className="tw:py-4">
                <div className="tw:font-semibold tw:text-sm tw:mb-2">
                  <AppLink
                    asLink={true}
                    href={`/dashboard/inventory/products/view/${item.dealInfo?.dealId}`}
                    className="tw:font-medium"
                  >
                    {item.dealInfo.dealName}
                  </AppLink>
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  ID: {item.dealInfo.dealRefId}
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:py-4">
                <Amount value={item.dealInfo?.mrp ?? 0} />
              </AppTable.Cell>

              <AppTable.Cell className="tw:py-4">
                <div className="tw:text-sm">
                  {item.dealInfo?.quantity ?? "-"}
                </div>
                <div className="tw:text-xs tw:text-gray-500">units</div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:py-4">
                <AppSelect
                  size="sm"
                  options={reserveOptions}
                  value={item.formData.enableReserve}
                  onChange={(val: any) => {
                    callback({
                      action: "update-index-form",
                      data: {
                        index: index,
                        key: "enableReserve",
                        value: val,
                      },
                    });
                  }}
                  inputClassName="tw:w-full tw:mb-4"
                />
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center tw:py-4">
                <AppButton
                  fill="outline"
                  size="small"
                  color="danger"
                  onClick={() => {
                    callback({
                      action: "remove-from-cart",
                      data: { itemId: item._id, index },
                    });
                  }}
                >
                  <Trash2 size={16} />
                </AppButton>
              </AppTable.Cell>
            </AppTable.Row>
          );
        })}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
