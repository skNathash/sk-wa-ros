import clsx from "clsx";
import { Package, ShoppingBasket } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";
import type { OrderDetailView } from "../helper";
import Section from "./Section";

/** Line items with the subtotal / discount / freight / total footer. */
const ProductsSection = ({ order }: { order: OrderDetailView }) => (
  <Section
    title="Products"
    icon={<ShoppingBasket size={13} />}
    count={order.items.length}
  >
    {order.items.length === 0 ? (
      <div className="tw:px-4 tw:py-6">
        <NoData />
      </div>
    ) : (
      order.items.map((item) => (
        <div
          key={item.key}
          className={clsx("od-item", item.isCancelled && "od-item-off")}
        >
          <span className="od-thumb">
            {item.imageId ? (
              <ImgRender
                assetId={item.imageId}
                className="tw:h-full tw:w-full tw:object-cover"
                fallback={<Package size={15} />}
              />
            ) : (
              <Package size={15} />
            )}
          </span>

          <div className="tw:min-w-0 tw:flex-1">
            <p className="od-item-name">{item.name}</p>
            <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
              <span className="od-qty">{item.qtyLabel}</span>
              <span className="od-item-meta tw:mt-0!">
                <Amount value={item.price} decimalPlaces={2} /> each
                {item.meta ? ` · ${item.meta}` : ""}
              </span>
            </div>
            {item.isCancelled && item.statusLbl ? (
              <p className="od-item-meta tw:text-rose-500!">{item.statusLbl}</p>
            ) : null}
          </div>

          <span className="od-item-amount tw:shrink-0">
            <Amount value={item.amount} decimalPlaces={2} />
          </span>
        </div>
      ))
    )}

    <div className="od-totals">
      <div className="od-total-row">
        <span>Subtotal</span>
        <strong>
          <Amount value={order.subTotal} decimalPlaces={2} />
        </strong>
      </div>
      {order.discount > 0 ? (
        <div className="od-total-row od-total-credit">
          <span>Discount</span>
          <strong>
            −<Amount value={order.discount} decimalPlaces={2} />
          </strong>
        </div>
      ) : null}
      {order.coinsRedeemedValue > 0 ? (
        <div className="od-total-row od-total-credit">
          <span>Coins redeemed</span>
          <strong>
            −<Amount value={order.coinsRedeemedValue} decimalPlaces={2} />
          </strong>
        </div>
      ) : null}
      {order.shippingCharges > 0 ? (
        <div className="od-total-row">
          <span>Freight</span>
          <strong>
            <Amount value={order.shippingCharges} decimalPlaces={2} />
          </strong>
        </div>
      ) : null}
      <div className="od-total-row od-total-grand">
        <span>Total</span>
        <span className="od-total-amount">
          <Amount value={order.total} decimalPlaces={2} />
        </span>
      </div>
    </div>
  </Section>
);

export default ProductsSection;
