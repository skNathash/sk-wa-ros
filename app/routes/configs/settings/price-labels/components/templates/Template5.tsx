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
  body: {
    flexGrow: 1,
    display: "flex",
    alignItems: "stretch",
  },
  priceCol: {
    flex: "1 1 60%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px 4px",
    borderRight: "1px solid black",
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
  infoCol: {
    flex: "1 1 40%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "4px",
    padding: "2px 6px",
  },
  mrpRow: {
    fontSize: "11px",
    fontWeight: 700,
    textDecoration: "line-through",
  },
  saveBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    lineHeight: "1.1",
  },
  saveLabel: {
    fontSize: "10px",
    fontWeight: 700,
  },
  saveValue: {
    fontSize: "16px",
    fontWeight: 700,
  },
};

const Template5: React.FC<TemplateProps> = ({ name, price, mrp, saving }) => {
  const discount = getSaving(saving, mrp, price);
  if (discount <= 0) {
    return <NoSavingLabel name={name} price={price} mrp={mrp} />;
  }
  return (
    <div style={styles.container}>
      <div style={styles.nameBox}>
        <div style={styles.name}>{name}</div>
      </div>

      <div style={styles.body}>
        <div style={styles.priceCol}>
          <span style={styles.priceLabel}>OUR PRICE</span>
          <BigNumber value={price} base={36} tracking={-2} symbol />
        </div>

        <div style={styles.infoCol}>
          <span style={styles.mrpRow}>MRP ₹{mrp}</span>
          <span style={styles.saveBox}>
            <span style={styles.saveLabel}>YOU SAVE</span>
            <span style={styles.saveValue}>₹{discount}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Template5;
