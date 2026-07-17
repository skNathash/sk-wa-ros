import React from "react";
import BigNumber from "./BigNumber";

interface Props {
  name: string;
  price: number;
  mrp: number;
}

/**
 * Shared fallback shown by every template when a product has no savings
 * (discount <= 0). Instead of a blank/zero savings block, it renders a clean,
 * price-focused label so full-price items still look intentional. Sized with
 * relative units so it adapts to each template's label dimensions.
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    border: "2px solid black",
    fontFamily: "inherit",
    backgroundColor: "white",
    color: "#000",
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  nameBox: {
    borderBottom: "2px solid black",
    padding: "6px 8px",
    height: "42px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },
  name: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: "13px",
    lineHeight: "1.15",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  priceBlock: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px 4px",
  },
  priceLabel: {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },
  priceValue: {
    fontWeight: 700,
    lineHeight: "1",
    letterSpacing: "-2px",
  },
  mrp: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: "11px",
    textDecoration: "line-through",
    paddingBottom: "3px",
  },
};

const NoSavingLabel: React.FC<Props> = ({ name, price, mrp }) => (
  <div style={styles.container}>
    <div style={styles.nameBox}>
      <div style={styles.name}>{name}</div>
    </div>
    <div style={styles.priceBlock}>
      <span style={styles.priceLabel}>OUR PRICE</span>
      <BigNumber value={price} base={40} tracking={-2} symbol />
    </div>
    {mrp > price && <div style={styles.mrp}>MRP ₹{mrp}</div>}
  </div>
);

export default NoSavingLabel;
