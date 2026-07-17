export interface LogisticsProductType {
  id: string;
  dealId: string;
  dealName: string;
  image: string;
  name: string;
  mrp: number;
  b2bprice: number;
  discount: number;
  hsn: string;
  barcode: string;
  packageQuantity: number;
  packageMrp: number;
  packageValue: number;
  claim?: {
    qty: number;
    reason: string;
    subReason?: string;
    actualMrp?: number;
    freeProductName?: string;
    wrongOrderId?: string;
    remarks?: string;
    attachments: string[];
  };
  finalQty?: number;
  _foundLoc?: boolean;
  _racks?: any;
  _rackOptions?: any;
  _bins?: any;
  _binOptions?: any;
  selectedLoc?: any;
  selectedRack?: any;
  selectedBin?: any;
  _qty: number;
  _mrp: number;
  _price: number;
  binStock?: any;
}
