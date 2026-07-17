import Amount from "~/components/core/amount/Amount";

type Props = {
  item: any;
};

const Item = ({ item }: Props) => {
  return (
    <div>
      <div className="tw:text-base tw:font-medium tw:mb-1">{item.name}</div>
      <div className="tw:flex tw:flex-row tw:justify-between tw:items-center">
        <div>
          <div className="tw:flex tw:flex-row tw:items-center tw:gap-2">
            <Amount
              value={item.price}
              decimalPlaces={2}
              className="tw:text-primary tw:font-medium"
            />
            {item.discount > 0 ? (
              <>
                <Amount
                  value={item.mrp}
                  decimalPlaces={2}
                  className="tw:line-through tw:text-sm tw:text-gray-500"
                />
                <span className="tw:text-sm tw:font-medium tw:text-green-600">
                  Margin {item.discount}%
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className="tw:text-sm tw:text-gray-500">
          <span>Qty: </span>
          <span>{item.quantity}</span>
        </div>
      </div>
    </div>
  );
};

export default Item;
