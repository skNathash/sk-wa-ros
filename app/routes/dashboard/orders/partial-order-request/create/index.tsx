import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Info,
  ShoppingBag,
  User,
  Package,
  CheckCircle2,
  ChevronLeft,
  AlertCircle,
  Truck,
  Hash,
  Calendar,
  Box,
  Phone,
  MapPin,
} from "lucide-react";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import { AppCheckbox } from "~/components/core/form";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import KeyValue from "~/components/core/key-value/KeyValue";
import Divider from "~/components/core/divider/Divider";
import OmsService from "~/services/OmsService";
import useAppToast from "~/hooks/useAppToast";
import DateFormat from "~/components/core/date/DateFormat";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import useScreenView from "~/hooks/useScreenView";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import AppLink from "~/components/core/link/AppLink";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import ChooseDeliveryDateModal from "./modals/ChooseDeliveryDateModal";
import type { SplitRequestRouteInfo } from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  { label: "Orders", redirect: { path: "/dashboard/orders/list" } },
  { label: "Create New Order" },
];

const SplitOrderCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const { show: showToast } = useAppToast();
  const { isMobile } = useScreenView();

  const [showDeliveryDateModal, setShowDeliveryDateModal] = useState(false);
  const [pendingItems, setPendingItems] = useState<any[]>([]);

  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "Confirm New Order",
    description:
      "Are you sure you want to create a new reservation request for the selected items?",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const {
    register,
    control,
    handleSubmit: formHandleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<any>({
    defaultValues: { items: [] },
  });

  const { fields } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  useEffect(() => {
    if (!orderId) return;

    let mounted = true;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const resp = await OmsService.getSellerOrderDetail(String(orderId));
        const fetched = resp?.data?.data || null;

        if (!mounted) return;

        if (fetched && fetched.items) {
          const formatted = OmsService.formatOrderResponse([fetched]);
          const finalOrder =
            formatted && formatted.length > 0 ? formatted[0] : fetched;
          setOrder(finalOrder);

          const fetchedReserveItems = (finalOrder.items || []).filter(
            (i: any) => i?.isReserve || i?.isReserveOrder,
          );

          const items = fetchedReserveItems.map((it: any) => ({
            dealRefId: it.dealRefId,
            dealId: String(it.dealId),
            quantity: it.quantity || 1,
            maxQuantity: it.quantity || 0,
            dealName: it.dealName || it.name || "",
            sku: it.sku || it.dealCode || "",
            originalItem: it,
          }));

          const initialSelected: Record<string, boolean> = {};
          items.forEach((it: any, idx: number) => {
            initialSelected[String(it.dealId || idx)] = true;
          });
          setSelected(initialSelected);
          reset({ items });
        } else {
          setOrder(fetched);
        }
      } catch (err) {
        setOrder(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      mounted = false;
    };
  }, [orderId]);

  const handleQtyChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    maxQty: number,
  ) => {
    const raw = e.target.value;
    const num = Number(raw);
    if (raw === "") {
      setValue(`items.${index}.quantity`, "", { shouldValidate: true });
      return;
    }
    if (isNaN(num)) return;
    const clamped = Math.max(1, Math.min(maxQty || 1, Math.floor(num)));
    setValue(`items.${index}.quantity`, clamped, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = async (data: any) => {
    const selectedItems = fields
      .map((field: any, idx: number) => ({ field, idx }))
      .filter(({ field }) => {
        const id = String(field.dealId || "");
        return id && selected[id];
      })
      .map(({ field, idx }) => {
        const qty = Number(data.items?.[idx]?.quantity || 0) || 0;
        return { ...field, quantity: qty };
      });

    if (!selectedItems || selectedItems.length === 0) {
      showToast({ msg: "Please select at least one item.", color: "error" });
      return;
    }

    setPendingItems(selectedItems);
    setShowDeliveryDateModal(true);
  };

  const handleDeliveryDateConfirm = (payload: {
    deliveryDate: string;
    routeInfo?: SplitRequestRouteInfo;
  }) => {
    const { deliveryDate, routeInfo } = payload;
    setShowDeliveryDateModal(false);
    setAppAlertDialog({
      show: true,
      title: "Confirm New Reservation Request",
      description: `You are about to create a new reservation request for ${pendingItems.length} item(s). This will require buyer approval.`,
      onConfirm: async () => {
        setAppAlertDialog((p) => ({ ...p, show: false }));
        await new Promise((r) => setTimeout(r, 200));
        await doSubmit(pendingItems, deliveryDate, routeInfo);
      },
      onCancel: () => setAppAlertDialog((p) => ({ ...p, show: false })),
    });
  };

  const doSubmit = async (
    items: any[],
    expectedShipping: string,
    routeInfo?: SplitRequestRouteInfo,
  ) => {
    if (!orderId) return;
    setIsSubmitting(true);

    const splitItems = items.map((it: any) => ({
      dealId: it.dealId || "",
      quantity: it.quantity || it.requestedQuantity || 1,
    }));

    try {
      const resp = await OmsService.createSplitRequest(String(orderId), {
        splitItems,
        expectedShipping,
        ...(routeInfo ? { routeInfo } : {}),
      });

      if (resp?.statusCode === 200 || resp?.statusCode === 201) {
        showToast({
          msg: resp?.data?.message || "New reservation request created successfully.",
          color: "success",
        });
        setTimeout(() => window.history.back(), 1500);
      } else {
        showToast({
          msg: resp?.data?.message || "Failed to create new reservation request.",
          color: "error",
        });
      }
    } catch (err: any) {
      showToast({
        msg: err?.message || "Error creating new reservation request.",
        color: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected],
  );
  const isAllSelected = fields.length > 0 && selectedCount === fields.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelected({});
    } else {
      const next: Record<string, boolean> = {};
      fields.forEach((f: any, idx: number) => {
        next[String(f.dealId || idx)] = true;
      });
      setSelected(next);
    }
  };

  const totalSplitQty = useMemo(() => {
    return (fields as any[]).reduce((acc, field, idx) => {
      const id = String(field.dealId || idx);
      if (selected[id]) {
        const item = watchedItems?.[idx];
        return acc + (Number(item?.quantity) || 0);
      }
      return acc;
    }, 0);
  }, [selected, watchedItems, fields]);

  return (
    <div className="tw:min-h-screen tw:bg-slate-50/50 tw:flex tw:flex-col">
      <AppHeader title={"Create New Order"} />

      <div className="app-page page-bg tw:p-4 tw:flex-1">
        <div className="app-container !tw:max-w-none">
          {/* Breadcrumbs & Title */}
          <div className="tw:mb-4 tw:flex tw:items-center tw:justify-between">
            <div className="tw:space-y-1">
              <AppBreadcrumbs data={breadcrumbs} />
            </div>
          </div>

          {!loading && !order && (
            <AppCard className="tw:text-center tw:py-12">
              <div className="tw:flex tw:flex-col tw:items-center">
                <AlertCircle className="tw:w-12 tw:h-12 tw:text-slate-300 tw:mb-4" />
                <h3 className="tw:text-lg tw:font-medium tw:text-slate-900">
                  No order data found
                </h3>
                <p className="tw:text-slate-500 tw:mt-1">
                  We couldn&#39;t find the order details you&#39;re looking for.
                </p>
                <AppButton
                  className="tw:mt-4"
                  color="primary"
                  onClick={() => window.history.back()}
                >
                  Return to Orders
                </AppButton>
              </div>
            </AppCard>
          )}

          {loading ? (
            <div className="tw:flex tw:flex-col tw:justify-center tw:items-center tw:h-64 tw:gap-3">
              <AppSpinner />
              <span className="tw:text-sm tw:font-medium tw:text-slate-500">
                Loading order details...
              </span>
            </div>
          ) : order ? (
            <div className="tw:space-y-6">
              {/* How it works - Full Width */}
              <AppCard
                className="tw:border-l-4 tw:border-l-indigo-500"
                title="How Create New Order Works"
                icon={<Info className="tw:w-5 tw:h-5 tw:text-indigo-500" />}
              >
                <p className="tw:text-sm tw:text-slate-600 tw:leading-relaxed">
                  Select{" "}
                  <span className="tw:font-semibold tw:text-indigo-700">
                    Reserve Items
                  </span>{" "}
                  that you want to move into a new order. An approval request
                  will be sent to the assigned buyers. Once approved, the items
                  will be separated into their own order automatically.
                </p>
              </AppCard>

              {/* Grid View: Order & Customer Info */}
              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
                {/* Order Details */}
                <AppCard
                  title="Order Summary"
                  icon={
                    <ShoppingBag className="tw:w-5 tw:h-5 tw:text-amber-500" />
                  }
                >
                  <div className="tw:space-y-4">
                    <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-4">
                      <KeyValue label="Order ID" size="sm" icon={Hash}>
                        <AppLink
                          href={`/dashboard/orders/view/${order.orderId || orderId}`}
                          asLink
                          showLinkColor
                          className="tw:font-bold"
                        >
                          {order.orderRefNo}
                        </AppLink>
                      </KeyValue>
                      <KeyValue label="Order Date" size="sm" icon={Calendar}>
                        <DateFormat value={order.orderedOn} />
                      </KeyValue>
                    </div>
                    <Divider className="tw:opacity-50" />
                    <KeyValue label="Exp. Shipping" size="sm" icon={Truck}>
                      <span className="tw:font-medium">
                        <DateFormat
                          value={order?.deliveryTimeSlot?.date || new Date()}
                        />
                      </span>
                    </KeyValue>
                  </div>
                </AppCard>

                {/* Customer Info */}
                <AppCard
                  title="Customer Information"
                  icon={<User className="tw:w-5 tw:h-5 tw:text-blue-500" />}
                >
                  <div className="tw:space-y-3">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <AppLink
                        href={`/dashboard/network/view/b2b/${order.customerInfo?.customerId}`}
                        asLink
                        showLinkColor
                        className="tw:font-bold"
                      >
                        {order.customerInfo?.name}
                      </AppLink>
                      <AppBadge
                        variant="light"
                        className="tw:text-[10px] tw:px-1.5 tw:py-0"
                      >
                        ID: {order.customerInfo?.refId || "N/A"}
                      </AppBadge>
                    </div>

                    <div className="tw:text-sm tw:space-y-2.5">
                      <div className="tw:flex tw:items-center tw:gap-2 tw:text-slate-600">
                        <Phone className="tw:w-3.5 tw:h-3.5 tw:text-slate-400" />
                        <span className="tw:font-medium">
                          {order.customerInfo?.mobile || "N/A"}
                        </span>
                      </div>
                      <div className="tw:flex tw:items-start tw:gap-2 tw:text-slate-600">
                        <MapPin className="tw:w-3.5 tw:h-3.5 tw:text-slate-400 tw:mt-0.5" />
                        <span className="tw:flex-1 tw:line-clamp-2">
                          {[
                            order.customerInfo?.address?.city,
                            order.customerInfo?.address?.district,
                            order.customerInfo?.address?.state,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                          {order.customerInfo?.address?.pincode &&
                            ` - ${order.customerInfo.address.pincode}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </AppCard>
              </div>

              {/* Items Section - Full Width */}
              <div>
                <form
                  id="create-order-request-form"
                  onSubmit={formHandleSubmit(onSubmit)}
                >
                  {isMobile ? (
                    <div className="tw:space-y-4">
                      {fields.length > 0 && (
                        <div className="tw:flex tw:items-center tw:justify-between tw:px-1">
                          <h3 className="tw:text-sm tw:font-bold tw:text-slate-900">
                            Select Items for New Order
                          </h3>
                          <div className="tw:flex tw:items-center tw:gap-2 tw:bg-white tw:px-2 tw:py-1 tw:rounded-lg tw:border tw:border-slate-200">
                            <span className="tw:text-[11px] tw:font-medium tw:text-slate-500">
                              Select All
                            </span>
                            <AppCheckbox
                              label=""
                              value={isAllSelected}
                              onChange={toggleSelectAll}
                            />
                          </div>
                        </div>
                      )}

                      {fields.length === 0 ? (
                        <AppCard className="tw:text-center tw:py-12">
                          <Box className="tw:w-12 tw:h-12 tw:mb-3 tw:mx-auto tw:opacity-20" />
                          <p className="tw:text-sm tw:font-medium">
                            No reserve items available
                          </p>
                        </AppCard>
                      ) : (
                        <div className="tw:space-y-3 tw:pb-32">
                          <MobileView
                            fields={fields}
                            selected={selected}
                            onSelect={(id, checked) =>
                              setSelected((prev) => ({
                                ...prev,
                                [id]: checked,
                              }))
                            }
                            register={register}
                            handleQtyChange={handleQtyChange}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <AppCard
                      noContentPadding
                      title={
                        <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
                          <div className="tw:flex tw:items-center tw:gap-2">
                            <Package className="tw:w-5 tw:h-5 tw:text-emerald-500" />
                            <span>Select Items for New Order</span>
                            {selectedCount > 0 && (
                              <AppBadge variant="primary" className="tw:ml-2">
                                {selectedCount} Selected
                              </AppBadge>
                            )}
                          </div>
                          {fields.length > 0 && (
                            <div className="tw:flex tw:items-center tw:gap-2">
                              <span className="tw:text-xs tw:font-normal tw:text-slate-500">
                                Select All
                              </span>
                              <AppCheckbox
                                label=""
                                value={isAllSelected}
                                onChange={toggleSelectAll}
                              />
                            </div>
                          )}
                        </div>
                      }
                    >
                      {fields.length === 0 ? (
                        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-16 tw:text-slate-400">
                          <Box className="tw:w-12 tw:h-12 tw:mb-3 tw:opacity-20" />
                          <p className="tw:text-sm tw:font-medium">
                            No reserve items available for new order
                          </p>
                          <p className="tw:text-xs tw:mt-1">
                            All items in this order are regular items.
                          </p>
                        </div>
                      ) : (
                        <AppScrollArea className="tw:max-h-[600px] tw:min-h-[300px]">
                          <DesktopView
                            fields={fields}
                            selected={selected}
                            onSelect={(id, checked) =>
                              setSelected((prev) => ({
                                ...prev,
                                [id]: checked,
                              }))
                            }
                            register={register}
                            handleQtyChange={handleQtyChange}
                          />
                        </AppScrollArea>
                      )}
                    </AppCard>
                  )}
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {order && (
        <div className="app-footer">
          <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
            <div className="tw:flex tw:gap-6">
              <div className="tw:flex tw:flex-col">
                <span className="tw:text-[10px] tw:uppercase tw:text-slate-500 tw:font-bold tw:tracking-wider">
                  Items to move
                </span>
                <span className="tw:text-lg tw:font-bold tw:text-slate-900">
                  {selectedCount}
                </span>
              </div>
              <div className="tw:flex tw:flex-col">
                <span className="tw:text-[10px] tw:uppercase tw:text-slate-500 tw:font-bold tw:tracking-wider">
                  Total Quantity
                </span>
                <span className="tw:text-lg tw:font-bold tw:text-slate-900">
                  {totalSplitQty}
                </span>
              </div>
            </div>
            <div className="tw:flex tw:items-center tw:gap-3">
              <AppButton
                color="light"
                fill="outline"
                type="button"
                onClick={() => window.history.back()}
                disabled={isSubmitting}
                className="tw:hidden tw:sm:flex"
              >
                Cancel
              </AppButton>
              <AppButton
                color="primary"
                type="submit"
                form="create-order-request-form"
                isLoading={isSubmitting}
                disabled={fields.length === 0 || selectedCount === 0}
                className="tw:px-8"
              >
                <CheckCircle2 className="tw:w-4 tw:h-4 tw:mr-2 tw:hidden tw:sm:block" />
                Submit New Reservation Request
              </AppButton>
            </div>
          </div>
        </div>
      )}

      <ChooseDeliveryDateModal
        show={showDeliveryDateModal}
        customerId={order?.customerInfo?.customerId || ""}
        onClose={() => setShowDeliveryDateModal(false)}
        onConfirm={handleDeliveryDateConfirm}
      />

      <AppAlertDialog
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        show={appAlertDialog.show}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
      />
    </div>
  );
};

export default SplitOrderCreatePage;
