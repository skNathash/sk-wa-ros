import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import {
  AppTable,
  TableHeader,
  type TableHeaderItem,
} from "~/components/core/table";

const DesktopView = () => {
  const { t } = useTranslation(["common"]);

  const headers: TableHeaderItem[] = [
    { label: t("slNo"), width: "10%" },
    { label: t("invoiceNo"), width: "15%" },
    { label: t("invoicedOn"), width: "15%" },
    { label: t("deliveredOn"), width: "15%" },
    { label: t("invoiceValue"), width: "15%" },
    { label: t("status"), width: "15%" },
    { label: t("product"), width: "15%" },
    { label: t("action"), width: "20%" },
  ];

  return (
    <AppTable>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        <tr>
          <td>1</td>
          <td>INV-001</td>
          <td>2021-01-01</td>
          <td>2021-01-01</td>
          <td>100</td>
          <td>{t("pending")}</td>
          <td>{t("product")} 1</td>
          <td>
            <AppButton
              color="primary"
              size="small"
              fill="clear"
              className="mr-2"
            >
              {t("trackShipment")}
            </AppButton>
            <AppButton color="primary" size="small" fill="clear">
              {t("downloadInvoice")}
            </AppButton>
          </td>
        </tr>
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
