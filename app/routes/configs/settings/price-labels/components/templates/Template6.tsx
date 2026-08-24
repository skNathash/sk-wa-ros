import React from "react";
import { getSaving } from "./helper";
import NoSavingLabel from "./NoSavingLabel";
import BigNumber from "./BigNumber";

interface TemplateProps {
  name: string;
  price: number;
  mrp: number;
  saving?: number;
}

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
    padding: "4px 8px",
    boxSizing: "border-box",
  },
  name: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: "12px",
    lineHeight: "1.15",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  priceRow: {
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "6px",
    paddingTop: "2px",
  },
  priceLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.3px",
    whiteSpace: "nowrap",
    lineHeight: "1.1",
  },
  bottomRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "6px",
  },
  mrp: {
    fontSize: "11px",
    fontWeight: 700,
    textDecoration: "line-through",
    whiteSpace: "nowrap",
  },
  save: {
    fontSize: "17px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
};

const Template6: React.FC<TemplateProps> = ({ name, price, mrp, saving }) => {
  const discount = getSaving(saving, mrp, price);
  if (discount <= 0) {
    return <NoSavingLabel name={name} price={price} mrp={mrp} />;
  }
  return (
    <div style={styles.container}>
      <div style={styles.name}>{name}</div>

      <div style={styles.priceRow}>
        <span style={styles.priceLabel}>OUR PRICE</span>
        <BigNumber value={price} base={56} tracking={-2} symbol />
      </div>

      <div style={styles.bottomRow}>
        <span style={styles.mrp}>MRP ₹{mrp}</span>
        <span style={styles.save}>SAVE ₹{discount}</span>
      </div>
    </div>
  );
};

export default Template6;
