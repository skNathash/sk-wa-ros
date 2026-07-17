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
  nameBox: {
    height: "30px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
  middle: {
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  saveBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    lineHeight: "1",
    marginRight: "6px",
  },
  saveText: {
    fontSize: "16px",
    fontWeight: 700,
  },
  saveCurrency: {
    fontSize: "20px",
    fontWeight: 700,
  },
  discount: {
    fontWeight: 700,
    lineHeight: "1",
    letterSpacing: "-3px",
    flexGrow: 1,
    textAlign: "center",
  },
  bottom: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    fontWeight: 700,
    fontSize: "11px",
  },
  mrp: {
    textDecoration: "line-through",
  },
  rkValue: {
    fontSize: "18px",
    fontWeight: 700,
  },
};

const Template4: React.FC<TemplateProps> = ({ name, price, mrp, saving }) => {
  const discount = getSaving(saving, mrp, price);
  if (discount <= 0) {
    return <NoSavingLabel name={name} price={price} mrp={mrp} />;
  }
  return (
    <div style={styles.container}>
      <div style={styles.nameBox}>
        <div style={styles.name}>{name}</div>
      </div>

      <div style={styles.middle}>
        <div style={styles.saveBlock}>
          <span style={styles.saveText}>SAVE</span>
          <span style={styles.saveCurrency}>₹</span>
        </div>
        <BigNumber
          value={discount}
          base={50}
          tracking={-3}
          style={{ flexGrow: 1, textAlign: "center" }}
        />
      </div>

      <div style={styles.bottom}>
        <span style={styles.mrp}>MRP ₹{mrp}</span>
        <span>
          PRICE ₹<span style={styles.rkValue}>{price}</span>
        </span>
      </div>
    </div>
  );
};

export default Template4;
