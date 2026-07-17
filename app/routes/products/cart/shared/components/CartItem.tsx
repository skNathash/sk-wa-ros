import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";

const CartItem = ({ item }: { item: any }) => {
  return (
    <div className="tw:flex tw:gap-4 tw:mb-4 tw:border-b tw:border-gray-200 tw:pb-4">
      <div>
        <ImgRender
          assetId={item.images?.[0]}
          className="tw:w-16 tw:h-16 tw:object-cover tw:rounded-md"
        />
      </div>
      <div className="tw:flex-1">
        <div className="tw:font-medium tw:text-gray-900 tw:mb-2">
          {item.deal?.name}
        </div>
        <div className="tw:flex tw:gap-4 tw:mb-4">
          <KeyValue label="HSN:" horizontal size="xs">
            {item.hsn}
          </KeyValue>

          <KeyValue label="GST:" horizontal size="xs">
            {item.tax}%
          </KeyValue>
        </div>

        <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4">
          <div className="tw:mb-2">
            <div className="tw:text-slate-600 tw:text-sm tw:md:text-xs tw:mb-0.5">
              MRP
            </div>
            <Amount value={item.mrp} className="tw:font-semibold" />
          </div>

          <div className="tw:mb-2">
            <div className="tw:text-slate-600 tw:text-sm tw:md:text-xs tw:mb-0.5">
              Price
            </div>
            <Amount
              value={item.purchasePrice}
              className="tw:text-blue-600 tw:font-semibold"
            />
          </div>

          <div className="tw:mb-2">
            <div className="tw:text-slate-600 tw:text-sm tw:md:text-xs tw:mb-0.5">
              Quantity
            </div>
            <span className="tw:text-red-600 tw:font-semibold">
              {item.quantity}{" "}
              <span className="tw:text-slate-500 tw:text-xs tw:font-normal">
                units
              </span>
            </span>
          </div>

          <div className="tw:mb-2">
            <div className="tw:text-slate-600 tw:text-sm tw:md:text-xs tw:mb-0.5">
              Total
            </div>
            <Amount
              value={item.purchasePrice * item.quantity}
              className="tw:text-blue-600 tw:font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
