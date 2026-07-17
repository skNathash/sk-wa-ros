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
    lineHeight: "1.2",
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
  },
  topSection: {
    flexGrow: 1,
    borderBottom: "2px solid black",
    padding: "3px 6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  offContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginRight: "3px",
    fontWeight: 700,
  },
  offText: {
    fontSize: "19px",
    lineHeight: "1",
  },
  currency: {
    fontSize: "25px",
    lineHeight: "0.8",
    marginTop: "3px",
  },
  discountAmount: {
    fontWeight: 700,
    lineHeight: "1",
    marginTop: "-5px",
    letterSpacing: "-3px",
  },
  bottomSection: {
    padding: "3px 6px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "38px",
  },
  productNameContainer: {
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "3px",
    overflow: "hidden",
  },
  productNameText: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: "10px",
    lineHeight: "1.15",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
  },
  prices: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10px",
    fontWeight: 700,
  },
  mrp: {
    textDecoration: "line-through",
  },
};

const Template2: React.FC<TemplateProps> = ({ name, price, mrp, saving }) => {
  const discount = getSaving(saving, mrp, price);
  if (discount <= 0) {
    return <NoSavingLabel name={name} price={price} mrp={mrp} />;
  }
  return (
    <div style={styles.container}>
      <div style={styles.topSection}>
        <div style={styles.offContainer}>
          <span style={styles.offText}>OFF</span>
          <span style={styles.currency}>₹</span>
        </div>
        <BigNumber
          value={discount}
          base={56}
          tracking={-3}
          style={{ marginTop: "-5px" }}
        />
      </div>

      <div style={styles.bottomSection}>
        <div style={styles.productNameContainer}>
          <div style={styles.productNameText}>{name}</div>
        </div>

        <div style={styles.prices}>
          <span style={styles.mrp}>MRP ₹{mrp}</span>
          <span>OUR PRICE ₹{price}</span>
        </div>
      </div>
    </div>
  );
};

export default Template2;
