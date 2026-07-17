export interface VendorAddress {
  addressLine: string;
  doorNo: string;
  street: string;
  landmark: string;
  city: string;
  town: string;
  district: string;
  state: string;
  postcode: string;
}

export interface SimilarVendor {
  id: string;
  name: string;
  gstin: string;
  address: VendorAddress;
  mobileNumber: string;
  contactPerson: string;
}

export interface InvoiceVendor {
  name: string;
  gstin: string;
  address: VendorAddress;
  mobileNumber: string;
  contactPerson: string;
  franchiseId: string;
  similarVendors?: SimilarVendor[];
  matchedVendor?: SimilarVendor;
}

export interface InvoiceInfo {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  poNumber: string;
  placeOfSupply: string;
  referenceNumber: string;
}

export interface InvoiceBuyer {
  name: string;
  gstin: string;
  address: VendorAddress;
  mobileNumber: string;
  contactPerson: string;
  franchiseId: string;
}

export interface SimilarDeal {
  _id: string;
  dealId: string;
  dealName: string;
  hsn: string;
  images: string[];
  barcode: string;
  applicableMenu: { menuName: string; menuId: string };
  applicableCategory: { categoryName: string; categoryId: string };
  applicableBrand: { brandName: string; brandId: string };
  isSubscribed: boolean;
  isMatched: boolean;
  subscriptionStatus: string;
}

export interface SelectedDeal {
  dealId: string;
  skId?: string;
  dealName: string;
  hsn: string;
  barcode: string;
  mrp: number;
  price: number;
  qty: number;
  discount: number;
  gst: number;
  isMatched: boolean;
  isPending?: boolean;
}

export interface InvoiceItem {
  lineNumber: number;
  name: string;
  barcode: string;
  hsn: string;
  mrp: number;
  price: number;
  qty: number;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  discountInRs: number;
  subtotal: number;
  taxableAmount: number;
  tax: number;
  cessPercent: number;
  cessAmount: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  totalAmount: number;
  similarDeals: SimilarDeal[];
  selected?: SelectedDeal;
}

export interface TaxBreakupItem {
  taxType: string;
  taxPercent: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface InvoiceTaxSummary {
  cgst: number;
  sgst: number;
  igst: number;
  breakup?: TaxBreakupItem[];
}

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  roundOff: number;
  grandTotal: number;
}

export interface ParsedInvoice {
  vendor: InvoiceVendor;
  invoice: InvoiceInfo;
  buyer: InvoiceBuyer;
  franchise: InvoiceBuyer;
  items: InvoiceItem[];
  similarVendors?: SimilarVendor[];
  taxSummary?: InvoiceTaxSummary;
  totals?: InvoiceTotals;
}

export interface InvoiceScanResponse {
  success: boolean;
  invoice: ParsedInvoice;
}

export interface ItemFormData {
  name: string;
  hsn: string;
  barcode: string;
  price: number;
  mrp: number;
  discount: number;
  qty: number;
  tax: number;
}

export interface VendorFormData {
  name: string;
  gstin: string;
  address: VendorAddress;
  mobileNumber: string;
  contactPerson: string;
}

export interface BuyerFormData {
  name: string;
  gstin: string;
  address: VendorAddress;
  mobileNumber: string;
  contactPerson: string;
}
