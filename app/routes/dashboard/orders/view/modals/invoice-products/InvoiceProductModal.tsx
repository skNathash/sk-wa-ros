import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppModal from "~/components/core/modal/AppModal";
import { AppTable, TableHeader } from "~/components/core/table";

interface InvoiceProductModalProps {
  show: boolean;
  callback: (response: { action: string; data?: any }) => void;
  products: any[];
  invoiceId: string;
}

const InvoiceProductModal = ({
  show,
  callback,
  products,
  invoiceId,
}: InvoiceProductModalProps) => {
  const { t } = useTranslation(["common"]);
  const totalAmount = products.reduce(
    (a: any, b: any) => a + b.price * b.quantity,
    0,
  );

  const onClose = () => {
    callback({ action: "close" });
  };

  const headers = [
    {
      label: t("slNo"),
      key: "sl",
    },
    {
      label: t("product"),
      key: "product",
      width: "50%",
    },
    {
      label: t("mrp"),
      key: "mrp",
    },
    {
      label: t("price"),
      key: "price",
    },
    {
      label: t("quantity"),
      key: "quantity",
    },
  ];

  return (
    <AppModal show={show} callback={callback} className="offcanvas-modal">
      <AppModal.Title onClose={onClose} noShadow={true}>
        {t("invoiceProducts")} - {invoiceId}
      </AppModal.Title>
      <AppModal.Content className="ion-padding">
        <div className="tw:text-sm tw:text-gray-500 tw:mb-2">
          {t("showingProductsInInvoice", { count: products.length })}
        </div>
        <AppTable size="sm" bordered={true}>
          <AppTable.Header>
            <TableHeader headers={headers} />
          </AppTable.Header>
          <AppTable.Body>
            {products.map((product: any, index: number) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{product.name}</td>
                <td>
                  <Amount value={product.mrp} />
                </td>
                <td>
                  <Amount value={product.price} />
                </td>
                <td>{product.quantity}</td>
              </tr>
            ))}
          </AppTable.Body>
          <AppTable.Footer>
            <tr>
              <td colSpan={5}>
                <div className="tw:flex tw:justify-end tw:gap-2 tw:py-2 tw:font-semibold">
                  {t("totalAmount")}:{" "}
                  <Amount value={totalAmount} decimalPlaces={2} />
                </div>
              </td>
            </tr>
          </AppTable.Footer>
        </AppTable>
      </AppModal.Content>
    </AppModal>
  );
};

export default InvoiceProductModal;
