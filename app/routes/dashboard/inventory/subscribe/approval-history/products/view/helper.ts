export type Item = {
  _id: string;
  productName: string;
  brandName: string;
  categoryName: string;
  mrp: number;
  price: number;
  weight?: number;
  unitType: string;
  barcode: string;
  hsn?: string;
  gst?: number;
  description: string;
  images?: string[];
  isConsumerOffer?: boolean;
  consumerOfferData?: string | null;
  consumerOfferPrice?: number | null;
};
