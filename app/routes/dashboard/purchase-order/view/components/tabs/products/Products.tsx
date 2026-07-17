import { InfoIcon, Search } from "lucide-react";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import AppPopover from "~/components/core/popover/AppPopover";
import RecentPurchasePopover from "~/shared/vendor/popovers/recent-purchase/RecentPurchasePopover";
import ReceivedDetails from "./ReceivedDetails";
import Summary from "./Summary";
import Divider from "~/components/core/divider/Divider";

interface ProductsTabProps {
  items: any[];
  callback: (data: { action: string; data: any }) => void;
}

const statusOptions = [
  { value: "all", label: "All" },
  { value: "received", label: "Received" },
  { value: "not_received", label: "Not Received" },
];

const Products: React.FC<ProductsTabProps> = ({ items, callback }) => {
  const { control, register } = useForm<{
    search: string;
    status: string;
  }>({
    defaultValues: { search: "", status: "all" },
  });
  const [search, status] = useWatch({ control, name: ["search", "status"] });

  const filteredItems = useMemo(() => {
    const searchText = (search || "").toLowerCase().trim();
    const selStatus = status || "all";

    const matchesSearch = (it: any) => {
      if (!searchText) return true;
      return (
        String(it.dealName || "")
          .toLowerCase()
          .includes(searchText) ||
        String(it.dealRefId || "")
          .toLowerCase()
          .includes(searchText)
      );
    };

    const isReceived = (it: any) =>
      it?.status === "Completed" || it?.status === "Partially Received";

    const matchesStatus = (it: any) => {
      if (selStatus === "all") return true;
      if (selStatus === "received") return isReceived(it);
      if (selStatus === "not_received") return !isReceived(it);
      return true;
    };

    return (items || []).filter((it) => matchesSearch(it) && matchesStatus(it));
  }, [items, search, status]);

  const summary = useMemo(() => {
    const isReceived = (it: any) =>
      it?.status === "Completed" || it?.status === "Partially Received";

    const totalProducts = filteredItems.length;
    const totalUnits = filteredItems.reduce(
      (sum, it) => sum + Number(it.quantity || 0),
      0
    );

    const receivedItems = filteredItems.filter((it) => isReceived(it));
    const receivedProducts = receivedItems.length;
    const receivedUnits = receivedItems.reduce(
      (sum, it) => sum + Number(it.receivedQuantity || 0),
      0
    );

    const notReceivedItems = filteredItems.filter((it) =>
      ["Partially Received", "Approved", "Pending"].includes(it.status)
    );
    const notReceivedProducts = notReceivedItems.length;
    const notReceivedUnits = notReceivedItems.reduce(
      (sum, it) =>
        sum + (Number(it.quantity || 0) - Number(it.receivedQuantity || 0)),
      0
    );

    return {
      total: { products: totalProducts, units: totalUnits },
      received: { products: receivedProducts, units: receivedUnits },
      notReceived: { products: notReceivedProducts, units: notReceivedUnits },
    };
  }, [filteredItems]);

  return (
    <>
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-end tw:gap-3 tw:mb-4">
        <AppInput
          name="search"
          placeholder="Search products by name or ID"
          register={register}
          inputClassName="tw:w-full"
          className="tw:w-full tw:md:flex-1"
          leftIcon={<Search className="tw:w-4 tw:h-4 tw:text-gray-400" />}
        />

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <AppSelect
              options={statusOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select status"
              className="tw:w-full tw:md:w-64"
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>

      <Summary
        totalProducts={summary.total.products}
        totalUnits={summary.total.units}
        receivedProducts={summary.received.products}
        receivedUnits={summary.received.units}
        notReceivedProducts={summary.notReceived.products}
        notReceivedUnits={summary.notReceived.units}
      />

      {filteredItems.map((item) => (
        <AppCard key={item.dealId} noPadding className="tw:overflow-hidden">
          <div className="tw:p-3 tw:w-full">
            <div className="tw:flex tw:gap-4">
              <div>
                <div className="tw:w-14 tw:h-14 tw:bg-gray-200 tw:rounded-lg tw:flex tw:items-center tw:justify-center"></div>
              </div>
              <div className="tw:flex-1">
                <h3 className="tw:md:text-lg tw:text-base tw:font-semibold tw:mb-1">
                  <AppLink
                    asLink={true}
                    href={`/dashboard/inventory/products/view/${item.dealId}`}
                    showLinkColor={true}
                  >
                    {item.dealName}
                  </AppLink>
                </h3>
                <div className="tw:flex tw:justify-between tw:items-center-safe tw:gap-2">
                  <div className="tw:text-xs tw:text-gray-500 tw:font-normal">
                    ID: {item.dealRefId}
                  </div>
                  <div>
                    <AppBadge variant={item._statusColor}>
                      {item._statusLabel}
                    </AppBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Divider className="tw:my-0!" />

          <div className="tw:grid tw:grid-cols-3 tw:md:grid-cols-6 tw:gap-4 tw:p-3">
            <KeyValue label="Ordered" size="sm">
              <span className="tw:font-medium">{item.quantity || 0} units</span>
            </KeyValue>

            <KeyValue label="Invoiced Qty" size="sm">
              <span className="tw:font-medium">
                {item.invoicedQuantity || item.invoiceQuantity} units
              </span>
            </KeyValue>

            <KeyValue label="MRP" size="sm">
              <Amount value={item.mrp} decimalPlaces={2} />
            </KeyValue>

            <KeyValue label="Purchase Price" size="sm">
              <div className="tw:flex tw:items-center tw:gap-2">
                <Amount value={item.purchasePrice} decimalPlaces={2} />
                <AppPopover
                  triggerContent={
                    <InfoIcon className="tw:text-blue-400 tw:w-4 tw:h-4" />
                  }
                >
                  <RecentPurchasePopover
                    productId={item._id || item.dealId}
                    limit={3}
                  />
                </AppPopover>
              </div>
            </KeyValue>

            {item.damagedQuantity > 0 && (
              <KeyValue label="Damaged" size="sm">
                <span className="tw:font-medium tw:text-red-500">
                  {item.damagedQuantity} units
                </span>
              </KeyValue>
            )}

            <KeyValue label="Total Value" size="sm">
              <Amount value={item._totalValue} decimalPlaces={2} />
            </KeyValue>
          </div>

          <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-4">
            <div className="tw:md:flex-1">
              {(item.status === "Completed" ||
                item.status === "Partially Received") && (
                <ReceivedDetails item={item} />
              )}
            </div>
          </div>
        </AppCard>
      ))}
    </>
  );
};

export default Products;
