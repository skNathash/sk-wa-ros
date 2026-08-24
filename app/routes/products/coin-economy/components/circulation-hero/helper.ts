import {
  getKingCoinsSummary,
  type KingCoinsSummary,
} from "../../helper";

/** The banner reads the whole snapshot — circulation, holders, top holder. */
export const getData = async (): Promise<KingCoinsSummary> =>
  getKingCoinsSummary();
