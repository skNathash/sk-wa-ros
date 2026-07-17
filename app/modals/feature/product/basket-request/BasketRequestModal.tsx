import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import FranchiseService from "~/services/FranchiseService";
import ProductService from "~/services/ProductService";
import type { Deal } from "~/types/CommonTypes";
import AppButton from "~/components/core/button/AppButton";
import { useForm } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import { ShoppingCart, User } from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

type Props = {
  show: boolean;
  callback: () => void;
  dealId: string;
};

const BasketRequestModal = ({ show, callback, dealId }: Props) => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      quantity: 1,
    },
  });

  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [qty, setQty] = useState(1);
  const [seller, setSeller] = useState<any>(null);

  useEffect(() => {
    if (show) {
      const fetchDeal = async () => {
        setLoading(true);
        const dealResp = await ProductService.getProducts({
          filter: {
            _id: dealId,
          },
        });
        const d = dealResp.data?.[0];
        setDeal(d || null);
        // Fetch seller info from connected sellers (first index)
        const sellers = FranchiseService.getConnectedSellers();
        setSeller(sellers?.[0] || null);
        setLoading(false);
      };
      fetchDeal();
    }
  }, [show, dealId]);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d]/g, "");
    let n = Math.max(
      Number(deal?.minQty || 1),
      Math.min(Number(val), Number(deal?.maxQty || 9999))
    );
    setQty(n);
  };

  const onSubmit = (data: any) => {};

  return (
    <AppModal show={show} callback={callback} className="offcanvas-modal">
      <AppModal.Title onClose={callback} noShadow={true}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:text-primary">Add to Purchase Basket</div>
        </div>
      </AppModal.Title>
      <AppModal.Content className="ion-padding modal-bg">
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
            <AppSpinner />
          </div>
        ) : null}

        {!loading && deal?.id ? (
          <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-6">
            <AppCard>
              <div className="tw:flex tw:gap-6">
                <div className="tw:w-28 tw:h-28 tw:rounded-lg tw:border tw:border-gray-100 tw:overflow-hidden tw:bg-gray-50">
                  <ImgRender
                    assetId={deal?.images?.[0]}
                    className="tw:w-full tw:h-full tw:object-cover"
                  />
                </div>
                <div className="tw:flex-1">
                  <div className="tw:text-xl tw:font-semibold tw:text-gray-800 tw:mb-2">
                    {deal?.name}
                  </div>
                  <div className="tw:flex tw:gap-4 tw:items-center tw:mb-3">
                    <Amount
                      value={deal?.price}
                      decimalPlaces={2}
                      className="tw:text-2xl tw:font-bold tw:text-primary"
                    />
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <span className="tw:line-through tw:text-gray-400">
                        <span className="tw:text-sm">MRP</span>
                        <Amount
                          value={deal?.mrp}
                          decimalPlaces={2}
                          className="tw:text-sm"
                        />
                      </span>
                      <span className="tw:bg-green-100 tw:text-green-700 tw:px-2 tw:py-1 tw:rounded-full tw:text-xs tw:font-medium">
                        {deal?.discount}% OFF
                      </span>
                    </div>
                  </div>
                  {deal?.brand && (
                    <div className="tw:text-sm tw:text-gray-500">
                      Brand:{" "}
                      <span className="tw:font-medium">{deal.brand.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </AppCard>

            {/* Seller Info Card */}
            <AppCard>
              <div className="tw:flex tw:items-center tw:justify-between">
                <div>
                  <div className="tw:text-sm tw:text-blue-700 tw:font-medium tw:mb-1">
                    You are requesting to the below seller
                  </div>
                  <div className="tw:font-semibold tw:text-gray-900 tw:flex tw:items-center tw:mb-1">
                    <User className="tw:text-primary tw:mr-2" size={18} />
                    {seller?.name}
                  </div>
                  <div className="tw:text-sm tw:text-gray-500">
                    ID: {seller?.franId}
                  </div>
                </div>
                {seller?.status && (
                  <div className="tw:bg-blue-100 tw:text-blue-800 tw:px-3 tw:py-1 tw:rounded-full tw:text-xs tw:font-medium">
                    {seller.status}
                  </div>
                )}
              </div>
            </AppCard>

            {/* Quantity Input */}
            <AppCard>
              <div className="tw:mb-4">
                <label
                  htmlFor="quantity"
                  className="tw:block tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-1"
                >
                  Quantity
                </label>
                <div className="tw:flex tw:items-center tw:gap-3">
                  <AppInput
                    name="quantity"
                    type="text"
                    className="tw:flex-1"
                    register={register}
                  />
                  <div className="tw:text-xs tw:text-gray-500">
                    Min: {deal?.minQty} | Max: {deal?.maxQty}
                  </div>
                </div>
              </div>

              {/* Last Purchase Details */}
              {deal?.soldInfo && (
                <div className="tw:bg-white tw:rounded-lg tw:p-3 tw:border tw:border-gray-200">
                  <div className="tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-2">
                    Last Purchase
                  </div>
                  <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:text-sm">
                    <div>
                      <span className="tw:text-gray-500">Date:</span>{" "}
                      <span className="tw:font-medium">
                        <DateFormat
                          value={deal.soldInfo.lastOrder}
                          formatStr="dd MMM yyyy"
                        />
                      </span>
                    </div>
                    <div>
                      <span className="tw:text-gray-500">Quantity:</span>{" "}
                      <span className="tw:font-medium">
                        {deal.soldInfo.qty} units
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </AppCard>
          </form>
        ) : null}
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2 tw:px-4">
          <AppButton fill="outline">Cancel</AppButton>
          <AppButton>
            <ShoppingCart className="tw:mr-2" size={16} />
            Add to Basket
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default BasketRequestModal;
