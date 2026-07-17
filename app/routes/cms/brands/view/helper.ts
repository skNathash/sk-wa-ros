import { IndianRupee, Package, ShoppingBag, ShoppingCart } from "lucide-react";
import SellerCatalogService from "~/services/SellerCatalogService";

export const SUMMARY_DATA = [
  {
    label: "Total Products",
    icon: Package,
    color: "primary",
    valueKey: "totalProducts",
    isAmount: false,
  },
  {
    label: "Total Inventory Value",
    icon: IndianRupee,
    color: "success",
    valueKey: "totalInventoryValue",
    isAmount: true,
  },
  {
    label: "Total Revenue",
    icon: IndianRupee,
    color: "warning",
    valueKey: "totalRevenue",
    isAmount: true,
  },
  {
    label: "Units Sold",
    icon: Package,
    color: "danger",
    valueKey: "unitsSold",
    isAmount: false,
  },
];

export const getData = async (id: string) => {
  const response = await SellerCatalogService.getBrands({
    filter: {
      "applicableBrand.id": id,
    },
  });
  const d = response.data?.data?.[0];
  if (!d) {
    return {};
  }
  return SellerCatalogService.formatBrandResponse([d], true)[0];
};
